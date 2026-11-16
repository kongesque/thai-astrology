'use strict'

const assert = require('node:assert/strict')
const { test } = require('node:test')
const { spawnSync } = require('node:child_process')
const { resolve } = require('node:path')
const { ErrorCode } = require('@modelcontextprotocol/sdk/types.js')
const { withClient, checkTools, input } = require('./client-check.cjs')
const entry = resolve(__dirname, '../bin/thai-astrology-mcp.cjs')

test('Official SDK client initializes, discovers and validates all four tools over stdio', { timeout: 20000 }, async () => {
  await withClient(entry, checkTools)
})

test('MCP distinguishes protocol errors, tool failures and negative validation results', { timeout: 20000 }, async () => {
  await withClient(entry, async client => {
    await client.listTools()
    await assert.rejects(client.callTool({ name: 'unknown', arguments: {} }), error => error.code === ErrorCode.InvalidParams)
    await assert.rejects(client.listTools({ cursor: 'invalid' }), error => error.code === ErrorCode.InvalidParams)
    const invalid = { ...input, date: { ...input.date, month: 2, day: 30 } }
    for (const [name, args, code] of [
      ['calculate_horoscope', {}, 'INVALID_ARGUMENTS'],
      ['calculate_horoscope', { input, unexpected: true }, 'INVALID_ARGUMENTS'],
      ['calculate_horoscope', { input: invalid }, 'INVALID_INPUT'],
      ['search_locations', { countryCode: 'XX' }, 'INVALID_ARGUMENTS'],
      ['calculate_transits', { natal: input, transit: invalid }, 'INVALID_INPUT'],
      ['calculate_horoscope', { input: { ...input, date: { year: 2024, era: 'CE', month: 6, day: 21 }, ascendantReference: { method: 'sunrise', latitude: 89, longitude: 0, utcOffsetHours: 0 } } }, 'CALCULATION_ERROR'],
    ]) {
      const result = await client.callTool({ name, arguments: args })
      assert.equal(result.isError, true)
      assert.equal(result.structuredContent.ok, false)
      assert.equal(result.structuredContent.error.code, code)
      assert.deepEqual(JSON.parse(result.content[0].text), result.structuredContent)
      if (name === 'calculate_transits') assert.equal(result.structuredContent.error.issues[0].field, 'transit.date.day')
    }
    const validation = await client.callTool({ name: 'validate_horoscope_input', arguments: { input: null } })
    assert.equal(validation.isError, false)
    assert.equal(validation.structuredContent.ok, true)
    assert.equal(validation.structuredContent.data.valid, false)
  })
})

test('Stdio lifecycle negotiates both structured-output protocol revisions', { timeout: 20000 }, () => {
  for (const protocolVersion of ['2025-06-18', '2025-11-25']) {
    const messages = [
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion, capabilities: {}, clientInfo: { name: 'protocol-test', version: '1.0.0' } } },
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      { jsonrpc: '2.0', id: 2, method: 'ping' },
      { jsonrpc: '2.0', id: 3, method: 'tools/list' },
    ]
    const result = spawnSync(process.execPath, [entry], { input: messages.map(value => JSON.stringify(value)).join('\n') + '\n', encoding: 'utf8', timeout: 10000, maxBuffer: 4 * 1024 * 1024 })
    assert.ifError(result.error)
    assert.equal(result.status, 0)
    assert.equal(result.stderr, '')
    const responses = result.stdout.trim().split('\n').map(line => JSON.parse(line))
    assert.equal(responses.length, 3, 'Notifications must not generate responses')
    assert.equal(responses.find(item => item.id === 1).result.protocolVersion, protocolVersion)
    assert.equal(responses.find(item => item.id === 3).result.tools.length, 4)
  }
})

test('MCP command rejects arguments without writing non-protocol data to stdout', () => {
  const result = spawnSync(process.execPath, [entry, '--port', '3000'], { encoding: 'utf8', timeout: 10000 })
  assert.ifError(result.error)
  assert.equal(result.status, 2)
  assert.equal(result.stdout, '')
  assert.match(result.stderr, /^Usage:/)
})

test('MCP workflow resolves a birthplace, validates input and returns selected factors', { timeout: 20000 }, async () => {
  await withClient(entry, async client => {
    await client.listTools()
    const found = await client.callTool({ name: 'search_locations', arguments: { countryCode: 'TH', query: 'Chiang Mai', limit: 1 } })
    const province = found.structuredContent.data.items[0].provinceCode
    assert.equal(province, 'TH-50')
    const natal = { ...input, location: { province } }
    const validation = await client.callTool({ name: 'validate_horoscope_input', arguments: { input: natal } })
    assert.equal(validation.structuredContent.data.valid, true)
    const chart = await client.callTool({ name: 'calculate_horoscope', arguments: { input: natal, sections: ['points', 'calendar'] } })
    assert.equal(chart.isError, false)
    const data = chart.structuredContent.data
    assert.deepEqual(Object.keys(data), ['schemaVersion', 'profile', 'input', 'points', 'calendar'])
    assert.equal(data.points.ascendant.signName, 'กันย์')
    assert.equal(data.points.sun.signName, 'สิงห์')
    assert.equal(data.calendar.thaiLunarDate.label, 'ข๑๓ด๑๐')
    const transits = await client.callTool({ name: 'calculate_transits', arguments: { natal, transit: { ...natal, date: { ...natal.date, day: 16 } }, sections: [] } })
    assert.equal(transits.isError, false)
    assert.deepEqual(Object.keys(transits.structuredContent.data.natal), ['schemaVersion', 'profile', 'input'])
    assert.equal(transits.structuredContent.data.comparison.sun.natalHouse, 12)
    assert.equal(transits.structuredContent.data.natal.profile.referenceMode, 'auto')
    assert.equal(transits.structuredContent.data.transit.profile.referenceMode, 'auto')
  })
})
