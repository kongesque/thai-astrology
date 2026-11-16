'use strict'

const { Server } = require('@modelcontextprotocol/sdk/server/index.js')
const { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError } = require('@modelcontextprotocol/sdk/types.js')
const { executeThaiAstrologyTool, getThaiAstrologyTools } = require('thai-astrology/tools')
const { version } = require('../package.json')

/** Create an isolated server; the caller supplies its transport and lifecycle. */
function createThaiAstrologyMcpServer() {
  const definitions = getThaiAstrologyTools().map(tool => ({
    ...tool,
    // The envelope alternatives are all objects, including structured failures.
    outputSchema: { type: 'object', ...tool.outputSchema },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }))
  const names = new Set(definitions.map(tool => tool.name))
  const server = new Server({ name: 'thai-astrology', version }, {
    capabilities: { tools: {} },
    instructions: 'Calculate classical Thai astrology factors using explicit civil dates, BE/CE era, local time and birthplace. Ask for missing birth information. Signs start at zero; houses start at one. Resolved references and fallback reasons are returned in each chart. A validation result with valid:false requires corrected input. Calculation data is separate from any interpretation supplied by the host application.',
  })
  server.setRequestHandler(ListToolsRequestSchema, async request => {
    if (request.params?.cursor !== undefined) throw new McpError(ErrorCode.InvalidParams, 'This tool list has no additional pages')
    return { tools: definitions }
  })
  server.setRequestHandler(CallToolRequestSchema, async request => {
    if (!names.has(request.params.name)) throw new McpError(ErrorCode.InvalidParams, 'Unknown astrology tool')
    let result
    try {
      result = executeThaiAstrologyTool(request.params.name, request.params.arguments ?? {})
    } catch {
      throw new McpError(ErrorCode.InternalError, 'Unable to complete astrology calculation')
    }
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
      structuredContent: result,
      isError: !result.ok,
    }
  })
  return server
}

module.exports = { createThaiAstrologyMcpServer }
