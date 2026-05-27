// Fleet-level conformance scanner for Kinetic Gain Suite documents.
// Mirrors kg-protocol-detect for the routing layer + adds shape-level
// structural validation per spec.
/** Required top-level blocks per protocol — drives the structural check. */
export const REQUIRED_BLOCKS = {
    "agent-cards-spec": ["agent", "capabilities", "deployment", "safety_posture"],
    "mcp-tool-card-spec": ["tool", "schema", "safety", "audit"],
    "prompt-provenance-spec": ["prompt", "lineage", "authorship", "approval"],
    "evidence-bundle-spec": ["bundle", "items"]
};
