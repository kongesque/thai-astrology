'use strict'

const assert = require('node:assert/strict')
const api = require('thai-astrology')
const fixtures = require('./fixtures/release-0.1.7.json')

const tests = [
  ...require('./calculation.cjs'),
  ...require('./horoscope.cjs'),
  ...require('./sunrise.cjs'),
  ...fixtures.map(({ input, expected }, index) => [
    `release 0.1.7 chart fixture ${index + 1}`,
    () => assert.deepEqual(api.generateThaiAstrologyChart(input), expected),
  ]),
  ['Arabic and Thai channel formatting preserves the ascendant marker', () => {
    const chart = api.generateThaiAstrologyChart(fixtures[0].input)
    const arabic = ['58', '0', '9', '6', '14', '23', '', '', 'ลั', '', '7*', '']
    const thai = ['๕๘', '๐', '๙', '๖', '๑๔', '๒๓', '', '', 'ลั', '', '๗*', '']
    assert.deepEqual(api.formatChannelOutputs(chart), arabic)
    assert.deepEqual(api.formatChannelOutputs(chart, 'arabic'), arabic)
    assert.deepEqual(api.formatChannelOutputs(chart, { numerals: 'arabic' }), arabic)
    assert.deepEqual(api.formatChannelOutputs(chart, 'thai'), thai)
    assert.deepEqual(api.formatChannelOutputs(chart, { numerals: 'thai' }), thai)
  }],
  ['channel labels and numerals normalize correctly', () => {
    const chart = { channelOutputs: ['Channel 1: ๕๘', 'Channel 2: ลั๑*'] }
    assert.deepEqual(api.formatChannelOutputs(chart), ['58', 'ลั1*'])
    assert.deepEqual(api.formatChannelOutputs(chart, 'thai'), ['๕๘', 'ลั๑*'])
  }],
  ['Gregorian and Buddhist year inputs produce the same chart', () => {
    const { yearBe, ...input } = fixtures[0].input
    assert.deepEqual(api.generateThaiAstrologyChart({ ...input, yearBc: yearBe - 543 }), fixtures[0].expected)
  }],
  ['ruling planets normalize digits and remove duplicates', () => {
    const result = api.findRulingPlanets(['', 'ลั๑๑๒*'])
    assert.deepEqual(result, { numbers: ['1', '2'], names: ['ดาวอาทิตย์', 'ดาวจันทร์'] })
    assert.equal(api.formatRulingPlanets(result), 'ดาวอาทิตย์ (1) และ ดาวจันทร์ (2)')
    assert.throws(() => api.findRulingPlanets(['ลั']), /No ruling planets/)
    assert.throws(() => api.findRulingPlanets([]), /Unable to locate ascendant/)
  }],
  ['invalid month and missing year are rejected', () => {
    for (const monthTh of [0, 13, 1.5]) {
      assert.throws(() => api.generateThaiAstrologyChart({ ...fixtures[0].input, monthTh }), RangeError)
    }
    const { yearBe, ...input } = fixtures[0].input
    assert.throws(() => api.generateThaiAstrologyChart(input), TypeError)
  }],
]

let failed = 0
for (const [name, test] of tests) {
  try {
    test()
    console.log(`PASS ${name}`)
  } catch (error) {
    failed += 1
    console.error(`FAIL ${name}`, error)
  }
}
console.log(`${tests.length - failed}/${tests.length} tests passed`)
process.exitCode = failed ? 1 : 0
