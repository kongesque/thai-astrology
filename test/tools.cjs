'use strict'

const assert = require('node:assert/strict')
const api = require('thai-astrology')
const { executeThaiAstrologyTool: execute, getThaiAstrologyTools } = require('thai-astrology/tools')
const { getThaiAstrologySchemas } = require('thai-astrology/schemas')
const input = { date: { year: 2024, era: 'CE', month: 9, day: 15 }, time: { hour: 8, minute: 30 }, location: { province: 'TH-50' } }

// Check serialized engine outputs against the published schema vocabulary, including
// nested references, union alternatives, closed records and fixed-length tuples.
function conforms(value, schema, root = schema) {
  if (schema.$ref) return conforms(value, root.$defs[schema.$ref.split('/').pop()], root)
  if (schema.not) return false
  if (schema.anyOf) return schema.anyOf.some(branch => conforms(value, branch, root))
  if ('const' in schema && value !== schema.const) return false
  if (schema.type === 'null') return value === null
  if (schema.type === 'string' || schema.type === 'boolean') return typeof value === schema.type
  if (schema.type === 'number') return typeof value === 'number' && Number.isFinite(value)
  if (schema.type === 'array') return Array.isArray(value) &&
    (schema.minItems === undefined || value.length >= schema.minItems) &&
    (schema.maxItems === undefined || value.length <= schema.maxItems) &&
    value.every((item, index) => conforms(item, schema.prefixItems ? schema.prefixItems[index] : schema.items, root))
  if (schema.type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    (schema.required || []).every(key => Object.hasOwnProperty.call(value, key)) &&
    Object.entries(value).every(([key, item]) => Object.hasOwnProperty.call(schema.properties, key) && conforms(item, schema.properties[key], root))
  assert.deepEqual(schema, {}, 'Unexpected unconstrained schema')
  return true
}

module.exports = [
  ['Tool outputs preserve direct API results and satisfy published schemas', () => {
    const cases = [
      ['calculate_horoscope', { input }, api.calculateThaiHoroscope(input)],
      ['calculate_transits', { natal: input, transit: input }, api.calculateHoroscopeTransits(input, input)],
      ['validate_horoscope_input', { input }, api.validateHoroscopeInput(input)],
      ['validate_horoscope_input', { input: null }, api.validateHoroscopeInput(null)],
      ['search_locations', { countryCode: 'US', query: 'New York', limit: 1 }, api.searchThaiAstrologyLocations({ countryCode: 'US', query: 'New York', limit: 1 })],
      ['search_locations', { countryCode: 'TH', query: 'absent-name' }, { items: [], total: 0 }],
      ['calculate_horoscope', { input: { ...input, date: { year: 1500, era: 'CE', month: 1, day: 1 }, referenceMode: 'traditional' } }, undefined],
    ]
    const schemas = getThaiAstrologySchemas()
    for (const [name, args, expected] of cases) {
      const result = execute(name, args)
      assert.equal(result.ok, true, JSON.stringify(result))
      if (expected !== undefined) assert.deepEqual(result.data, expected)
      assert.ok(conforms(JSON.parse(JSON.stringify(result)), schemas[name].outputSchema), name)
      const restored = JSON.parse(JSON.stringify(args))
      assert.ok(conforms(restored, schemas[name].inputSchema), name)
    }
    const result = execute('calculate_horoscope', { input })
    delete result.data.profile
    assert.equal(conforms(result, schemas.calculate_horoscope.outputSchema), false)
  }],
  ['Tool boundaries reject malformed arguments and unknown names without coercion', () => {
    for (const name of ['toString', '__proto__', 'unknown']) assert.equal(execute(name, {}).error.code, 'UNKNOWN_TOOL')
    for (const args of [null, [], {}, { input, extra: true }, { input: { ...input, tiem: {} } }, { input: { ...input, time: { hour: '8', minute: 30 } } }, { input: { ...input, time: { hour: Infinity, minute: 0 } } }]) {
      assert.equal(execute('calculate_horoscope', args).error.code, 'INVALID_ARGUMENTS')
    }
    for (const args of [{ countryCode: 'XX' }, { countryCode: 'TH', limit: 0 }, { countryCode: 'TH', query: 'x'.repeat(201) }]) assert.equal(execute('search_locations', args).error.code, 'INVALID_ARGUMENTS')
    assert.equal(execute('validate_horoscope_input', { input: { unexpected: true } }).data.valid, false)
    // The additive adapter does not change the earlier library's permissive extra fields.
    assert.equal(api.validateHoroscopeInput({ ...input, extra: true }).valid, true)
  }],
  ['Tool domain failures retain actionable field issues and never return partial charts', () => {
    const invalid = { ...input, date: { ...input.date, month: 2, day: 30 } }
    const result = execute('calculate_horoscope', { input: invalid })
    assert.equal(result.ok, false)
    assert.equal(result.error.code, 'INVALID_INPUT')
    assert.equal(result.error.issues[0].field, 'date.day')
    const transit = execute('calculate_transits', { natal: invalid, transit: invalid })
    assert.deepEqual(transit.error.issues.map(issue => issue.field), ['natal.date.day', 'transit.date.day'])
    const polar = execute('calculate_horoscope', { input: { ...input, date: { year: 2024, era: 'CE', month: 6, day: 21 }, ascendantReference: { method: 'sunrise', latitude: 89, longitude: 0, utcOffsetHours: 0 } } })
    assert.equal(polar.error.code, 'CALCULATION_ERROR')
    for (const [name, error] of [['calculate_horoscope', result], ['calculate_transits', transit], ['calculate_horoscope', polar]]) {
      assert.ok(conforms(error, getThaiAstrologySchemas()[name].outputSchema))
      assert.equal(error.data, undefined)
    }
  }],
  ['Tool definitions and schemas are JSON-serializable isolated copies', () => {
    const tools = getThaiAstrologyTools()
    assert.deepEqual(tools.map(tool => tool.name), ['search_locations', 'validate_horoscope_input', 'calculate_horoscope', 'calculate_transits'])
    assert.deepEqual(JSON.parse(JSON.stringify(tools)), tools)
    tools[0].inputSchema.properties.countryCode.type = 'number'
    assert.equal(getThaiAstrologyTools()[0].inputSchema.properties.countryCode.type, 'string')
    getThaiAstrologySchemas().calculate_horoscope.inputSchema.$defs.object1.required.length = 0
    assert.equal(execute('calculate_horoscope', {}).error.code, 'INVALID_ARGUMENTS')
  }],
  ['Selected horoscope sections retain exact values, references and fallbacks', () => {
    const schemas = getThaiAstrologySchemas()
    const full = api.calculateThaiHoroscope(input)
    const sections = ['points', 'houses', 'charts', 'factors', 'calendar', 'taksa', 'relationships', 'timing', 'diagnostics']
    for (const section of sections) {
      const result = execute('calculate_horoscope', { input, sections: [section] })
      assert.deepEqual(result.data, { schemaVersion: full.schemaVersion, profile: full.profile, input: full.input, [section]: full[section] })
      assert.ok(conforms(result, schemas.calculate_horoscope.outputSchema))
    }
    const { location, ...withoutProvince } = input
    const metadata = execute('calculate_horoscope', { input: withoutProvince, sections: [] }).data
    assert.deepEqual(Object.keys(metadata), ['schemaVersion', 'profile', 'input'])
    assert.equal(metadata.profile.referenceFallback, 'missing-province')
    assert.deepEqual(execute('calculate_horoscope', { input, sections: ['points', 'points'] }).data,
      execute('calculate_horoscope', { input, sections: ['points'] }).data)
    assert.deepEqual(execute('calculate_horoscope', { input }).data, full)
    assert.deepEqual(api.calculateThaiHoroscope(input), full)
  }],
  ['Selected transit sections preserve comparison and independent chart references', () => {
    const transitInput = { ...input, date: { ...input.date, day: 16 }, referenceMode: 'traditional' }
    const full = api.calculateHoroscopeTransits(input, transitInput)
    const result = execute('calculate_transits', { natal: input, transit: transitInput, sections: ['calendar'] })
    assert.deepEqual(result.data.comparison, full.comparison)
    for (const key of ['natal', 'transit']) {
      assert.deepEqual(result.data[key], { schemaVersion: full[key].schemaVersion, profile: full[key].profile, input: full[key].input, calendar: full[key].calendar })
    }
    assert.ok(conforms(result, getThaiAstrologySchemas().calculate_transits.outputSchema))
    const minimal = execute('calculate_transits', { natal: input, transit: input, sections: [] })
    assert.deepEqual(Object.keys(minimal.data.natal), ['schemaVersion', 'profile', 'input'])
    assert.equal(minimal.data.comparison.sun.longitudeDifferenceDegrees, 0)
  }],
  ['Section selection rejects unknown names and keeps invalid charts as failures', () => {
    for (const sections of [null, 'points', ['point'], [1], ['profile'], ['__proto__']]) {
      assert.equal(execute('calculate_horoscope', { input, sections }).error.code, 'INVALID_ARGUMENTS')
      assert.equal(execute('calculate_transits', { natal: input, transit: input, sections }).error.code, 'INVALID_ARGUMENTS')
    }
    const invalid = { ...input, time: { hour: 25, minute: 0 } }
    assert.equal(execute('calculate_horoscope', { input: invalid, sections: [] }).error.code, 'INVALID_INPUT')
  }],
]
