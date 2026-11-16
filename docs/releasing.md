# Release acceptance criteria

[English README](../README-en.md) · [README ภาษาไทย](../README.md)

A core release candidate is ready when every applicable criterion below passes. Passing tests with a skipped or unavailable validation layer must be reported explicitly. Preparing a candidate does not publish it, create a tag or push a branch.

## Core library

- `npm run check` passes on Node.js 24, including strict typecheck, public regression tests, available local validation and installed-package verification.
- Public tests and installed CommonJS, ESM, TypeScript and browser consumers pass on Node.js 16, 22 and 24, as required by CI. Check the candidate commit's CI result before merging or publishing.
- Existing default calls and released-package regression fixtures remain unchanged. Any intentional numerical change needs independently supported regression evidence.
- The runtime remains free of external dependencies; ES2019 output and explicit date, era, units and reference conventions are preserved.
- Generated JSON Schemas match public TypeScript types and actual results. Tool failures are actionable and selected responses retain calculation metadata.
- Birthplace workflows cover Thai and foreign locations, seasonal offsets, repeated/nonexistent civil times, manual offsets and equivalent BE/CE dates. Missing birth times and geographic timezones are never guessed.
- Both READMEs and API guides describe shipped behavior, and their examples run. Local resources and development reports remain excluded from Git and npm archives.

## Optional MCP adapter

- SDK client tests and packed-consumer tests pass on its supported CI runtimes, Node.js 22 and 24. The adapter requires Node.js 20+; the core retains its own Node.js 16 minimum.
- Discovery, schema validation, full/selected results and the complete international workflow work through stdio. A real MCP client smoke test uses synthetic data.
- Protocol revisions and optional capabilities are documented accurately. The core archive contains neither adapter dependencies nor client configuration.
- A private local adapter can accompany a core release. A separate public adapter release additionally requires removing `private`, choosing its version, and setting a peer range that includes a published core with the required entry points. Verify those two published artifacts together before announcing registry installation instructions.

## Final release preparation

- Choose the core version for the final API change and keep package metadata and lockfiles aligned. New additive capabilities belong in a minor version; incompatible changes require a clearly documented version boundary.
- Align the adapter's local peer dependency with the prepared core version, even while the adapter remains private.
- Review the final diff and package contents, ensure the intended branch is committed, and preserve unrelated working-tree changes.
- Merge/publish only with user authorization after the candidate commit's required CI checks pass. Publishing the core does not imply publishing the optional adapter.
