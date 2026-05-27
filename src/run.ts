import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  REQUIRED_BLOCKS,
  type ConformanceReport,
  type DocSummary,
  type Finding,
  type ProtocolId,
  type RunnerOptions
} from "./types.js";

const ALL_PROTOCOLS: ProtocolId[] = [
  "agent-cards-spec",
  "mcp-tool-card-spec",
  "prompt-provenance-spec",
  "evidence-bundle-spec",
  "otel-genai-otlp",
  "mcp-tools-list",
  "unknown"
];

function emptyCounts(): Record<ProtocolId, number> {
  const out = {} as Record<ProtocolId, number>;
  for (const p of ALL_PROTOCOLS) out[p] = 0;
  return out;
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

/** Local protocol detector (mirrors kg-protocol-detect — kept inline to avoid a peer dep). */
export function detectProtocol(input: unknown): { protocol: ProtocolId; version?: string } {
  if (input === null || typeof input !== "object" || Array.isArray(input)) return { protocol: "unknown" };
  const o = input as Record<string, unknown>;
  const acv = asString(o.agent_card_version);
  if (acv) return { protocol: "agent-cards-spec", version: acv };
  const tcv = asString(o.tool_card_version);
  if (tcv) return { protocol: "mcp-tool-card-spec", version: tcv };
  const ppv = asString(o.provenance_version);
  if (ppv) return { protocol: "prompt-provenance-spec", version: ppv };
  const ebv = asString(o.evidence_bundle_version);
  if (ebv) return { protocol: "evidence-bundle-spec", version: ebv };
  if (Array.isArray(o.resourceSpans)) return { protocol: "otel-genai-otlp" };
  if (Array.isArray(o.tools) && o.tools.every((t) => typeof t === "object" && t !== null && "name" in t)) {
    return { protocol: "mcp-tools-list" };
  }
  if (typeof o.agent === "object" && typeof o.capabilities === "object") return { protocol: "agent-cards-spec" };
  if (typeof o.tool === "object" && typeof o.safety === "object" && typeof o.audit === "object") return { protocol: "mcp-tool-card-spec" };
  if (typeof o.prompt === "object" && typeof o.lineage === "object") return { protocol: "prompt-provenance-spec" };
  if (typeof o.bundle === "object" && Array.isArray(o.items)) return { protocol: "evidence-bundle-spec" };
  return { protocol: "unknown" };
}

function structurallyConformant(doc: Record<string, unknown>, protocol: ProtocolId): { ok: boolean; missing: string[] } {
  if (protocol === "unknown" || protocol === "otel-genai-otlp" || protocol === "mcp-tools-list") return { ok: true, missing: [] };
  const required = REQUIRED_BLOCKS[protocol];
  const missing = required.filter((k) => doc[k] === undefined);
  return { ok: missing.length === 0, missing };
}

function listJsonFiles(root: string, skip: string[] = []): string[] {
  const out: string[] = [];
  const visit = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (skip.some((s) => full.includes(s))) continue;
      if (st.isDirectory()) visit(full);
      else if (/\.json$/i.test(entry)) out.push(full);
    }
  };
  visit(root);
  return out.sort();
}

export function run(root: string, opts: RunnerOptions = {}): ConformanceReport {
  const generatedAt = opts.now ?? new Date().toISOString();
  const failOnUnknown = opts.failOnUnknown ?? true;
  const files = listJsonFiles(root, opts.skip);
  const findings: Finding[] = [];
  const docs: DocSummary[] = [];
  const byProtocol = emptyCounts();

  for (const file of files) {
    let raw: string;
    try {
      raw = readFileSync(file, "utf8");
    } catch {
      findings.push({ code: "malformed-json", severity: "high", message: "could not read file", source: file });
      continue;
    }
    if (raw.trim().length === 0) {
      findings.push({ code: "empty-file", severity: "medium", message: "file is empty", source: file });
      continue;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      findings.push({ code: "malformed-json", severity: "high", message: (e as Error).message, source: file });
      continue;
    }
    const { protocol, version } = detectProtocol(parsed);
    byProtocol[protocol] += 1;

    const summary: DocSummary = { source: file, protocol, structurallyConformant: true };
    if (version) summary.version = version;

    if (protocol === "unknown") {
      summary.structurallyConformant = false;
      if (failOnUnknown) {
        findings.push({
          code: "unknown-protocol",
          severity: "medium",
          message: "could not detect protocol from version field or shape signals",
          source: file
        });
      }
    } else if (protocol !== "otel-genai-otlp" && protocol !== "mcp-tools-list") {
      const { ok, missing } = structurallyConformant(parsed as Record<string, unknown>, protocol);
      summary.structurallyConformant = ok;
      for (const k of missing) {
        findings.push({
          code: "missing-required-block",
          severity: "high",
          message: `required top-level block "${k}" missing for ${protocol}`,
          source: file,
          protocol
        });
      }
    }
    docs.push(summary);
  }
  docs.sort((a, b) => a.source.localeCompare(b.source));

  const ok = !findings.some((f) => f.severity === "high");
  return {
    generatedAt,
    files: files.length,
    byProtocol,
    docs,
    findings,
    ok
  };
}
