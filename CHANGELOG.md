# Changelog

## v0.1.0 — 2026-05-27

- Initial release: GitHub Action wrapping `kg-suite-conformance-runner` as a cross-protocol structural validator.
- Inputs: `dir` (required), `comment-on-pr` (auto/true/false), `fail-on-high` (default true), `fail-on-unknown` (default true), `skip` (comma-separated path substrings), `github-token`.
- Outputs: `total-files`, `high-findings`, `conformant-docs`, `unknown-docs`.
- Vendored detect + run + format logic — same routing semantics as `kg-protocol-detect`, same structural validation as the standalone library.
- 5 finding codes spanning routing failures (`unknown-protocol`, `malformed-json`, `empty-file`) and structural conformance (`missing-required-block`, `version-mismatch`).
- Posts per-PR Markdown comment when run on `pull_request` events with a valid token.
- Fails the run (exit 1) on any high-severity finding by default.
- Composite Node 20 action with `dist/index.js` committed for SHA/tag pinning.
- 4-document fixture corpus (clean AgentCard + clean Evidence Bundle + Tool Card missing audit block + unknown blob).
- Companion to `kg-suite-spec-version-tracker-action` — run both as a 2-gate Suite CI.
- Node 20/22 CI (lint, typecheck, coverage, build, `npm audit`), AGPL-3.0-or-later, Dependabot.
