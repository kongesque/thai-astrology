'use strict'

const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const { copyFileSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { resolve, dirname, join } = require('node:path')
const { executeThaiAstrologyTool, getThaiAstrologyTools } = require('thai-astrology/tools')
const { getThaiAstrologySchemas } = require('thai-astrology/schemas')
const cli = resolve(dirname(require.resolve('thai-astrology')), '../bin/thai-astrology.cjs')
const input = { date: { year: 2024, era: 'CE', month: 9, day: 15 }, time: { hour: 8, minute: 30 }, location: { province: 'TH-50' } }

function run(args, input = '') {
  const result = spawnSync(process.execPath, [cli, ...args], { input, encoding: 'utf8', timeout: 10000, maxBuffer: 4 * 1024 * 1024 })
  assert.ifError(result.error)
  assert.equal(result.signal, null)
  return result
}

module.exports = [
  ['CLI returns selected sections without losing calculation references', () => {
    const args = { input, sections: ['points', 'calendar'] }
    const result = run(['call', 'calculate_horoscope'], JSON.stringify(args))
    assert.equal(result.status, 0)
    const parsed = JSON.parse(result.stdout)
    assert.deepEqual(parsed, executeThaiAstrologyTool('calculate_horoscope', args))
    assert.deepEqual(Object.keys(parsed.data), ['schemaVersion', 'profile', 'input', 'points', 'calendar'])
    assert.equal(parsed.data.profile.referenceMode, 'auto')
  }],
  ['CLI discovers tools and exports complete schemas without reading stdin', () => {
    const tools = run(['tools'], 'not JSON')
    assert.equal(tools.status, 0)
    assert.equal(tools.stderr, '')
    assert.deepEqual(JSON.parse(tools.stdout).data, getThaiAstrologyTools())
    const schemas = run(['schemas'])
    assert.equal(schemas.status, 0)
    assert.deepEqual(JSON.parse(schemas.stdout).data, getThaiAstrologySchemas())
    const pretty = run(['schemas', 'calculate_horoscope', '--pretty'])
    assert.equal(pretty.status, 0)
    assert.match(pretty.stdout, /\n  "schemaVersion"/)
    assert.deepEqual(JSON.parse(pretty.stdout).data, getThaiAstrologySchemas().calculate_horoscope)
    assert.equal(pretty.stdout.endsWith('\n'), true)
  }],
  ['CLI stdin calls match all library tools including a full transit response', () => {
    for (const [name, args] of [
      ['resolve_birthplace', { date: input.date, time: input.time, location: { locationId: 'geonames:5128581' } }],
      ['calculate_horoscope', { input }],
      ['calculate_transits', { natal: input, transit: input }],
      ['validate_horoscope_input', { input: null }],
      ['search_locations', { countryCode: 'TH', query: 'เชียงใหม่' }],
    ]) {
      const result = run(['call', name], JSON.stringify(args))
      assert.equal(result.status, 0, result.stderr)
      assert.equal(result.stderr, '')
      assert.deepEqual(JSON.parse(result.stdout), executeThaiAstrologyTool(name, args))
    }
    const explicit = run(['call', 'calculate_horoscope', '--input', '-', '--pretty'], JSON.stringify({ input }))
    assert.equal(explicit.status, 0)
    assert.deepEqual(JSON.parse(explicit.stdout), executeThaiAstrologyTool('calculate_horoscope', { input }))
  }],
  ['CLI reads UTF-8 input files with spaces independently of stdin', () => {
    const temp = mkdtempSync(join(tmpdir(), 'thai-astrology-cli-'))
    try {
      const file = join(temp, 'ข้อมูล ดวง.json')
      const args = { input: { ...input, location: { province: 'เชียงใหม่' } } }
      writeFileSync(file, JSON.stringify(args))
      const result = run(['call', 'calculate_horoscope', '--input', file], 'ignored')
      assert.equal(result.status, 0)
      assert.deepEqual(JSON.parse(result.stdout), executeThaiAstrologyTool('calculate_horoscope', args))
      const missing = run(['call', 'calculate_horoscope', '--input', join(temp, 'missing.json')])
      assert.equal(missing.status, 2)
      assert.equal(JSON.parse(missing.stdout).error.code, 'INPUT_READ_ERROR')
      assert.match(missing.stderr, /^INPUT_READ_ERROR:/)
    } finally {
      rmSync(temp, { recursive: true, force: true })
    }
  }],
  ['CLI separates tool failures from command and JSON failures', () => {
    for (const [args, body, status, code] of [
      [['call', 'unknown'], '{}', 1, 'UNKNOWN_TOOL'],
      [['schemas', '__proto__'], '', 1, 'UNKNOWN_TOOL'],
      [['call', 'calculate_horoscope'], '{}', 1, 'INVALID_ARGUMENTS'],
      [['call', 'calculate_horoscope'], JSON.stringify({ input: { ...input, date: { ...input.date, day: 32 } } }), 1, 'INVALID_INPUT'],
      [['call', 'search_locations'], '{"countryCode":"XX"}', 1, 'INVALID_ARGUMENTS'],
      [['call', 'calculate_horoscope'], '', 2, 'INVALID_JSON'],
      [['call', 'calculate_horoscope'], '{"secret-birth-record":', 2, 'INVALID_JSON'],
      [['call', 'calculate_horoscope'], '{}\n{}', 2, 'INVALID_JSON'],
      [['call', 'calculate_horoscope'], '\uFEFF{}', 2, 'INVALID_JSON'],
    ]) {
      const result = run(args, body)
      assert.equal(result.status, status)
      const parsed = JSON.parse(result.stdout)
      assert.equal(parsed.schemaVersion, '1.0')
      assert.equal(parsed.ok, false)
      assert.equal(parsed.error.code, code)
      assert.ok(result.stderr.startsWith(`${code}:`))
      assert.equal((result.stdout + result.stderr).includes('secret-birth-record'), false)
    }
  }],
  ['CLI rejects ambiguous or misspelled commands and options before reading input', () => {
    for (const args of [[], ['unknown'], ['tools', 'extra'], ['schemas', 'one', 'two'], ['call'], ['call', 'one', 'two'], ['call', 'one', '--input'], ['call', 'one', '--input', '--pretty'], ['call', 'one', '--input', '-', '--input', '-'], ['tools', '--input', '-'], ['tools', '--prety'], ['tools', '--pretty', '--pretty']]) {
      const result = run(args)
      assert.equal(result.status, 2, args.join(' '))
      assert.equal(JSON.parse(result.stdout).error.code, 'CLI_USAGE_ERROR')
    }
    assert.match(run(['--help']).stdout, /Usage:/)
    assert.equal(run(['--help']).status, 0)
    const version = run(['--version'])
    assert.equal(version.status, 0)
    assert.equal(typeof JSON.parse(version.stdout).data.version, 'string')
  }],
  ['CLI reports an unavailable runtime as an internal failure without a stack trace', () => {
    const temp = mkdtempSync(join(tmpdir(), 'thai-astrology-cli-runtime-'))
    try {
      mkdirSync(join(temp, 'bin'))
      const isolated = join(temp, 'bin', 'thai-astrology.cjs')
      copyFileSync(cli, isolated)
      const result = spawnSync(process.execPath, [isolated, 'tools'], { encoding: 'utf8', timeout: 10000 })
      assert.ifError(result.error)
      assert.equal(result.status, 3)
      assert.equal(JSON.parse(result.stdout).error.code, 'INTERNAL_ERROR')
      assert.equal(result.stderr, 'INTERNAL_ERROR: Unexpected CLI failure\n')
    } finally {
      rmSync(temp, { recursive: true, force: true })
    }
  }],
]
