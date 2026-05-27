import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { run, type RunnerEnv } from "../src/runner.js";
import { run as runConformance } from "../src/run.js";
import { toMarkdown, toSummary } from "../src/format.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const FIXTURES = `${here}/../fixtures/suite-docs`;

function envWithInputs(inputs: Record<string, string>): RunnerEnv {
  return {
    inputs,
    readFile: (p) => readFileSync(p, "utf8"),
    write: () => undefined
  };
}

describe("runner.run", () => {
  it("exits 1 when fail-on-high set and high findings exist", async () => {
    const r = await run(envWithInputs({ dir: FIXTURES, fail_on_high: "true", comment_on_pr: "false" }));
    expect(r.exitCode).toBe(1);
    expect(r.report.findings.some((f) => f.severity === "high")).toBe(true);
    expect(r.commentPosted).toBe(false);
  });

  it("exits 0 when fail-on-high is false", async () => {
    const r = await run(envWithInputs({ dir: FIXTURES, fail_on_high: "false", comment_on_pr: "false" }));
    expect(r.exitCode).toBe(0);
  });

  it("rejects when dir input is missing", async () => {
    await expect(run({ inputs: {} })).rejects.toThrow(/dir/);
  });

  it("respects fail-on-unknown=false", async () => {
    const r = await run(envWithInputs({ dir: FIXTURES, fail_on_high: "true", fail_on_unknown: "false", comment_on_pr: "false" }));
    const unknown = r.report.findings.filter((f) => f.code === "unknown-protocol");
    expect(unknown).toHaveLength(0);
  });

  it("respects skip input as comma-separated substrings", async () => {
    const r = await run(envWithInputs({ dir: FIXTURES, fail_on_high: "false", comment_on_pr: "false", skip: "unknown" }));
    expect(r.report.files).toBe(3);
  });

  it("posts a PR comment in pull_request context", async () => {
    const calls: Array<{ body: string }> = [];
    const env: RunnerEnv = {
      inputs: { dir: FIXTURES, comment_on_pr: "auto", github_token: "ghs_test", fail_on_high: "false" },
      GITHUB_EVENT_NAME: "pull_request",
      GITHUB_REPOSITORY: "mizcausevic-dev/test",
      GITHUB_EVENT_PATH: `${here}/event.json`,
      readFile: (p) => (p.endsWith("event.json") ? JSON.stringify({ number: 42 }) : readFileSync(p, "utf8")),
      postComment: async (args) => { calls.push({ body: args.body }); },
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(true);
    expect(calls[0].body).toContain("Suite conformance");
  });

  it("skips PR comment when token is missing", async () => {
    const env: RunnerEnv = {
      inputs: { dir: FIXTURES, comment_on_pr: "true", fail_on_high: "false" },
      GITHUB_REPOSITORY: "x/y",
      GITHUB_EVENT_PATH: "/event.json",
      readFile: (p) => (p.endsWith("event.json") ? "{}" : readFileSync(p, "utf8")),
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
    expect(r.reason).toBe("no github-token provided");
  });

  it("skips PR comment when GITHUB_EVENT_PATH missing", async () => {
    const env: RunnerEnv = {
      inputs: { dir: FIXTURES, comment_on_pr: "true", github_token: "ghs", fail_on_high: "false" },
      GITHUB_REPOSITORY: "x/y",
      readFile: (p) => readFileSync(p, "utf8"),
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
    expect(r.reason).toBe("no GITHUB_EVENT_PATH");
  });

  it("skips PR comment when event has no PR number", async () => {
    const env: RunnerEnv = {
      inputs: { dir: FIXTURES, comment_on_pr: "true", github_token: "ghs", fail_on_high: "false" },
      GITHUB_REPOSITORY: "x/y",
      GITHUB_EVENT_PATH: "/event.json",
      readFile: (p) => (p.endsWith("event.json") ? "{}" : readFileSync(p, "utf8")),
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
    expect(r.reason).toBe("no PR number in event payload");
  });

  it("does not comment on non-PR events with comment_on_pr=auto", async () => {
    const env: RunnerEnv = {
      inputs: { dir: FIXTURES, comment_on_pr: "auto", github_token: "ghs", fail_on_high: "false" },
      GITHUB_EVENT_NAME: "push",
      readFile: (p) => readFileSync(p, "utf8"),
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
  });
});

describe("unit coverage", () => {
  it("runConformance returns a report on the fixture directory", () => {
    const r = runConformance(FIXTURES, { failOnUnknown: true });
    expect(r.files).toBe(4);
    expect(r.docs.length).toBeGreaterThan(0);
  });

  it("toMarkdown + toSummary render", () => {
    const r = runConformance(FIXTURES, { failOnUnknown: true });
    expect(toMarkdown(r)).toContain("conformance");
    expect(toSummary(r)).toContain("file");
  });
});
