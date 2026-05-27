import { type ConformanceReport, type ProtocolId, type RunnerOptions } from "./types.js";
/** Local protocol detector (mirrors kg-protocol-detect — kept inline to avoid a peer dep). */
export declare function detectProtocol(input: unknown): {
    protocol: ProtocolId;
    version?: string;
};
export declare function run(root: string, opts?: RunnerOptions): ConformanceReport;
