'use strict'

const assert = require('node:assert/strict')
const { Client } = require('@modelcontextprotocol/sdk/client/index.js')
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js')
const { executeThaiAstrologyTool, getThaiAstrologyTools } = require('thai-astrology/tools')

const input = { date: { year: 2024, era: 'CE', month: 9, day: 15 }, time: { hour: 8, minute: 30 }, location: { province: 'TH-50' } }

async function withClient(entry, check) {
  const client = new Client({ name: 'thai-astrology-test-client', version: '1.0.0' })
  const parameters = typeof entry === 'string' ? { command: process.execPath, args: [entry] } : entry
  const transport = new StdioClientTransport({ ...parameters, stderr: 'pipe' })
  let stderr = ''
  transport.stderr.on('data', chunk => { stderr += chunk.toString() })
  try {
    await client.connect(transport)
    await check(client)
    assert.equal(stderr, '', 'Protocol operations must not print diagnostics or birth data')
  } finally {
    await client.close()
  }
}

async function checkTools(client) {
  await client.ping()
  assert.equal(client.getServerVersion().name, 'thai-astrology')
  assert.deepEqual(client.getServerCapabilities(), { tools: {} })
  // listTools also compiles the published output schemas in the official SDK client.
  const { tools } = await client.listTools()
  assert.deepEqual(tools.map(tool => tool.name), getThaiAstrologyTools().map(tool => tool.name))
  assert.ok(tools.every(tool => tool.annotations.readOnlyHint && tool.annotations.openWorldHint === false))
  const calls = [
    ['search_locations', { countryCode: 'TH', query: 'เชียงใหม่' }],
    ['validate_horoscope_input', { input }],
    ['calculate_horoscope', { input }],
    ['calculate_transits', { natal: input, transit: { ...input, date: { ...input.date, day: 16 } } }],
    ['calculate_horoscope', { input, sections: ['points', 'calendar'] }],
    ['calculate_transits', { natal: input, transit: input, sections: [] }],
  ]
  await Promise.all(calls.map(async ([name, args]) => {
    const result = await client.callTool({ name, arguments: args })
    assert.equal(result.isError, false)
    assert.deepEqual(result.structuredContent, executeThaiAstrologyTool(name, args))
    assert.deepEqual(JSON.parse(result.content[0].text), result.structuredContent)
  }))
}

module.exports = { withClient, checkTools, input }
