# Thai Astrology MCP adapter

[ภาษาไทยและ API](../../docs/api.md#mcp-adapter) · [English API](../../docs/api-en.md#mcp-adapter)

Run the Thai Astrology tools in an MCP application through a local stdio process. The adapter uses the official MCP TypeScript SDK and the core library's existing dispatcher and JSON Schemas. It exposes:

- `search_locations`
- `resolve_birthplace`
- `validate_horoscope_input`
- `calculate_horoscope`
- `calculate_transits`

## Set up from this checkout

Use Node.js 20 or later for the adapter; Node.js 24 is used for development. The core library retains Node.js 16 support and zero runtime dependencies. This adapter is a private package in the repository. Its local development dependency points to the core checkout, which must include the `tools` and `schemas` entry points. These changes have not been published automatically.

From the repository root:

```bash
npm ci
npm --prefix adapters/mcp ci
npm --prefix adapters/mcp test
```

`npm ci` builds the core library. After editing core source, run `npm run build` again before starting the adapter. Adapter dependencies stay under `adapters/mcp/node_modules` and are excluded from the core npm archive.

## Connect an MCP client

For applications using an `mcpServers` configuration, replace both absolute paths below. Use an absolute Node.js 20+ executable path when the desktop application's PATH differs from your terminal.

```json
{
  "mcpServers": {
    "thai-astrology": {
      "command": "/absolute/path/to/node",
      "args": ["/absolute/path/to/thai-astrology/adapters/mcp/bin/thai-astrology-mcp.cjs"]
    }
  }
}
```

Other clients can use the same command and arguments in their own configuration format. The client launches the process and manages its lifecycle; the adapter accepts no command-line options. It uses newline-delimited JSON-RPC on stdin/stdout, with diagnostics on stderr. It does not open an HTTP port or contact an AI provider. Its tools are read-only and calculate in the local process.

For Codex, register the command with `codex mcp add thai_astrology -- /absolute/path/to/node /absolute/path/to/thai-astrology/adapters/mcp/bin/thai-astrology-mcp.cjs`, then start a new session. See [Codex setup](../../docs/api-en.md#connect-with-codex).

## Results and compatibility

Tool inputs match `getThaiAstrologyTools()`. Calculation calls accept optional `sections` to return selected data; profile, normalized input and schemaVersion are always retained, and transit comparisons remain complete. Omit the selection for full results. See [selected sections](../../docs/api-en.md#selected-result-sections). Each call returns the complete `AstrologyToolResult` envelope in both `structuredContent` and a JSON text block. The advertised output schema describes that envelope. Tool validation/calculation failures set `isError: true`; an unknown tool is an MCP invalid-params error. Negative validation (`data.valid: false`) is a successful tool execution and leaves `isError: false`.

Dates remain Gregorian civil dates with an explicit BE/CE era, and times are local civil clocks. No birth time, transit date or timezone choice is guessed. Results retain calculation profiles, normalized inputs, fallback reasons and Thai labels. Location search returns coordinates and IANA zones; a foreign chart still needs explicit reference settings as described in the core API guide.

The pinned SDK uses initialization-based MCP negotiation. Integration tests cover the `2025-06-18` and `2025-11-25` revisions, including structured results. Clients must support this negotiation model. See the official [MCP lifecycle](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle), [stdio transport](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports) and [tool result contract](https://modelcontextprotocol.io/specification/2025-11-25/server/tools). HTTP transport, model sampling, prompts, resources and background tasks are not advertised capabilities.

## Verify packed consumers

```bash
npm --prefix adapters/mcp run test:package
```

This packs the current core and adapter, installs both archives in a temporary consumer, and calls all five tools with the official SDK client. npm reuses its cache where possible and may download dependency metadata or SDK dependencies. The adapter remains private; publishing it is a separate release step after the compatible core is available on npm.
