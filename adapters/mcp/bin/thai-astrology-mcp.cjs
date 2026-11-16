#!/usr/bin/env node
'use strict'

async function main() {
  if (process.argv.length !== 2) {
    process.stderr.write('Usage: thai-astrology-mcp (stdio transport; no arguments)\n')
    process.exitCode = 2
    return
  }
  const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js')
  const { createThaiAstrologyMcpServer } = require('../src/server.cjs')
  const server = createThaiAstrologyMcpServer()
  server.onerror = () => process.stderr.write('MCP transport error\n')
  const close = () => server.close().catch(() => { process.exitCode = 1 })
  process.once('SIGINT', close)
  process.once('SIGTERM', close)
  await server.connect(new StdioServerTransport())
}

main().catch(() => {
  process.stderr.write('Unable to start Thai Astrology MCP adapter; install its dependencies and build the core library\n')
  process.exitCode = 1
})
