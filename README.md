# kg-suite-conformance-runner-action

[![CI](https://github.com/mizcausevic-dev/kg-suite-conformance-runner-action/actions/workflows/ci.yml/badge.svg)](https://github.com/mizcausevic-dev/kg-suite-conformance-runner-action/actions/workflows/ci.yml)
[![License: AGPL-3.0-or-later](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](LICENSE)

GitHub Action that walks a **mixed-protocol** directory of [Kinetic Gain Suite](https://suite.kineticgain.com/) JSON documents (AgentCards, MCP Tool Cards, prompt-provenance, evidence bundles, OTLP traces, MCP `tools/list`), validates that every required top-level block per spec is present, and **fails the build** on missing required blocks, unknown protocols, or malformed JSON.

Wraps [`kg-suite-conformance-runner`](https://github.com/mizcausevic-dev/kg-suite-conformance-runner).

**Cross-protocol structural validator** — companion to [`kg-suite-spec-version-tracker-action`](https://github.com/mizcausevic-dev/kg-suite-spec-version-tracker-action) (version drift) and the per-protocol fleet-summary action quartet (content-level findings).

Part of the [Kinetic Gain Suite](https://suite.kineticgain.com/).

---

## Usage

```yaml
name: Suite conformance gate
on:
  pull_request:
    paths: ["governance-docs/**"]

jobs:
  conformance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: mizcausevic-dev/kg-suite-conformance-runner-action@v0.1-shipped
        with:
          dir: governance-docs/
          fail-on-high: true
          fail-on-unknown: true
```

## Inputs

| input              | required | default       | description |
|---|---|---|---|
| `dir`              | ✓        | —             | Directory containing `*.json` Suite documents. |
| `comment-on-pr`    |          | `auto`        | `auto` posts only on `pull_request` events. |
| `fail-on-high`     |          | `true`        | Fail the run on any high-severity finding. |
| `fail-on-unknown`  |          | `true`        | Treat `unknown-protocol` findings as high severity. |
| `skip`             |          | —             | Comma-separated list of path substrings to skip. |
| `github-token`     |          | `${{ github.token }}` | Token used to post the PR comment. |

## Outputs

| output             | description |
|---|---|
| `total-files`      | Number of JSON files analyzed. |
| `high-findings`    | Count of high-severity findings. |
| `conformant-docs`  | Number of docs with all required top-level blocks. |
| `unknown-docs`     | Number of JSON files that did not match any known Suite spec. |

## What it flags

| Code | Severity | Rule |
|---|---|---|
| `missing-required-block` | 🔴 | Document is missing a required top-level block per its detected protocol's spec. |
| `malformed-json` | 🔴 | File is not valid JSON. |
| `unknown-protocol` | 🔴 (if `fail-on-unknown=true`) | JSON didn't match any known Suite spec. |
| `version-mismatch` | 🟠 | Document's `*_version` field doesn't match a known release. |
| `empty-file` | 🟠 | File is empty. |

## Composes with

- [**`kg-suite-conformance-runner`**](https://github.com/mizcausevic-dev/kg-suite-conformance-runner) — the library this wraps.
- [**`kg-protocol-detect`**](https://github.com/mizcausevic-dev/kg-protocol-detect) — the routing primitive used internally.
- [**`kg-suite-spec-version-tracker-action`**](https://github.com/mizcausevic-dev/kg-suite-spec-version-tracker-action) — sibling Action for version drift detection (run both as a 2-gate CI).
- The 4 per-protocol fleet-summary actions ([`agent-card-fleet-summary-action`](https://github.com/mizcausevic-dev/agent-card-fleet-summary-action), [`mcp-tool-card-fleet-summary-action`](https://github.com/mizcausevic-dev/mcp-tool-card-fleet-summary-action), [`prompt-provenance-fleet-summary-action`](https://github.com/mizcausevic-dev/prompt-provenance-fleet-summary-action), [`evidence-bundle-fleet-summary-action`](https://github.com/mizcausevic-dev/evidence-bundle-fleet-summary-action)) — content-level governance gates per protocol.

## License

[AGPL-3.0-or-later](LICENSE)
