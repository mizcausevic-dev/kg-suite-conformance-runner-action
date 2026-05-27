// Fleet-level conformance scanner for Kinetic Gain Suite documents.
// Mirrors kg-protocol-detect for the routing layer + adds shape-level
// structural validation per spec.

export type ProtocolId =
  | "agent-cards-spec"
  | "mcp-tool-card-spec"
  | "prompt-provenance-spec"
  | "evidence-bundle-spec"
  | "otel-genai-otlp"
  | "mcp-tools-list"
  | "unknown";

export type FindingSeverity = "high" | "medium" | "low" | "info";

export type FindingCode =
  | "unknown-protocol"
  | "missing-required-block"
  | "version-mismatch"
  | "malformed-json"
  | "empty-file";

export interface Finding {
  code: FindingCode;
  severity: FindingSeverity;
  message: string;
  source: string;
  protocol?: ProtocolId;
}

export interface DocSummary {
  source: string;
  protocol: ProtocolId;
  version?: string;
  /** True iff the doc has every required top-level block for its detected protocol. */
  structurallyConformant: boolean;
}

export interface ConformanceReport {
  generatedAt: string;
  files: number;
  byProtocol: Record<ProtocolId, number>;
  /** Per-doc verdicts, sorted by source. */
  docs: DocSummary[];
  findings: Finding[];
  ok: boolean;
}

export interface RunnerOptions {
  now?: string;
  /** Skip files whose paths match these substrings. */
  skip?: string[];
  /** Treat docs whose detected protocol is `unknown` as a finding. Default true. */
  failOnUnknown?: boolean;
}

/** Required top-level blocks per protocol — drives the structural check. */
export const REQUIRED_BLOCKS: Record<Exclude<ProtocolId, "unknown" | "otel-genai-otlp" | "mcp-tools-list">, string[]> = {
  "agent-cards-spec": ["agent", "capabilities", "deployment", "safety_posture"],
  "mcp-tool-card-spec": ["tool", "schema", "safety", "audit"],
  "prompt-provenance-spec": ["prompt", "lineage", "authorship", "approval"],
  "evidence-bundle-spec": ["bundle", "items"]
};
