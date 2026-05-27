import type { ConformanceReport, FindingSeverity, ProtocolId } from "./types.js";

const SEVERITY_LABEL: Record<FindingSeverity, string> = {
  high: "🔴 high",
  medium: "🟠 medium",
  low: "🟡 low",
  info: "ℹ️  info"
};
const SEVERITY_RANK: Record<FindingSeverity, number> = { high: 0, medium: 1, low: 2, info: 3 };

const PROTOCOL_LABEL: Record<ProtocolId, string> = {
  "agent-cards-spec": "AgentCard",
  "mcp-tool-card-spec": "MCP Tool Card",
  "prompt-provenance-spec": "Prompt Provenance",
  "evidence-bundle-spec": "Evidence Bundle",
  "otel-genai-otlp": "OTel GenAI OTLP",
  "mcp-tools-list": "MCP tools/list",
  unknown: "Unknown"
};

export function toMarkdown(report: ConformanceReport): string {
  const lines: string[] = [];
  lines.push(report.ok ? `# Kinetic Gain Suite conformance ✅` : `# Kinetic Gain Suite conformance ❌`);
  lines.push(``);
  lines.push(`Generated: \`${report.generatedAt}\``);
  lines.push(``);
  lines.push(`## Files by protocol`);
  lines.push(``);
  lines.push(`| protocol | files |`);
  lines.push(`|---|---:|`);
  for (const p of Object.keys(report.byProtocol) as ProtocolId[]) {
    if (report.byProtocol[p] === 0) continue;
    lines.push(`| ${PROTOCOL_LABEL[p]} | ${report.byProtocol[p]} |`);
  }

  if (report.findings.length > 0) {
    const ranked = [...report.findings].sort(
      (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.source.localeCompare(b.source)
    );
    lines.push(``);
    lines.push(`## Findings (${ranked.length})`);
    lines.push(``);
    lines.push(`| severity | code | source | message |`);
    lines.push(`|---|---|---|---|`);
    for (const f of ranked) {
      lines.push(`| ${SEVERITY_LABEL[f.severity]} | \`${f.code}\` | \`${f.source}\` | ${f.message} |`);
    }
  } else {
    lines.push(``);
    lines.push(`No findings.`);
  }
  return lines.join("\n");
}

export function toSummary(report: ConformanceReport): string {
  const counts: Record<FindingSeverity, number> = { high: 0, medium: 0, low: 0, info: 0 };
  for (const f of report.findings) counts[f.severity] += 1;
  return `${report.files} files · ${report.docs.length} parsed · ${counts.high} high · ${counts.medium} medium (${report.ok ? "ok" : "fail"})`;
}
