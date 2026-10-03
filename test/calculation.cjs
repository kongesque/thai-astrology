'use strict'

const assert = require('node:assert/strict')
const api = require('thai-astrology')

const input = { yearBc: 2024, monthTh: 9, day: 15, hour: 8, minute: 30, province: 'เชียงใหม่' }

module.exports = [
  ['Detailed calculations preserve full-turn normalization and mansion boundaries', () => {
    for (const [arc, sign, mansion] of [[0, 0, 0], [21600, 0, 0], [-1, 11, 26], [800, 0, 1]]) {
      const point = api.describeLongitude(arc)
      assert.equal(point.sign, sign)
      assert.equal(point.nakshatraIndex, mansion)
    }
    assert.throws(() => api.describeLongitude(NaN), RangeError)
    assert.throws(() => api.describeLongitude(0, 12), RangeError)
  }],
  ['Dates, year eras, local corrections and calculation profiles are validated', () => {
    for (const patch of [{ day: 31 }, { hour: 24 }, { minute: -1 }, { yearBe: 2567, yearBc: 2023 }, { province: 'toString' }, { localTimeCorrectionMinutes: Infinity }]) {
      assert.throws(() => api.calculateDetailedPositions({ ...input, ...patch }))
    }
    assert.throws(() => api.calculateAllPositions({ ...input, method: 'unknown' }), RangeError)
    assert.throws(() => api.calculateDetailedPositions({ ...input, yearBc: 2100, monthTh: 2, day: 29 }), RangeError)
    assert.doesNotThrow(() => api.calculateDetailedPositions({ ...input, monthTh: 2, day: 29 }))
    const { yearBc, ...other } = input
    assert.deepEqual(api.calculateDetailedPositions({ ...other, yearBe: yearBc + 543 }), api.calculateDetailedPositions(input))
  }],
  ['Chart points and houses stay consistent across province corrections and sign boundaries', () => {
    const base = api.calculateDetailedPositions({ ...input, province: 'ไม่ใช้จังหวัด' })
    for (let sign = 0; sign < 12; sign++) {
      const correction = input.hour * 60 + input.minute - base.ascendant.signStartTimesMinutes[sign]
      const chart = api.calculateDetailedPositions({ ...input, localTimeCorrectionMinutes: correction })
      assert.equal(chart.positions.ascendant, sign)
      assert.equal(chart.longitudes.ascendant.house, 1)
      assert.ok(chart.tanuseth >= 1 && chart.tanuseth <= 7)
      for (const [key, point] of Object.entries(chart.longitudes)) {
        assert.equal(point.sign, chart.positions[key])
        assert.equal(point.house, ((point.sign - sign + 12) % 12) + 1)
        assert.ok(point.longitudeArcMinutes >= 0 && point.longitudeArcMinutes < 21600)
        assert.ok(point.nakshatraIndex >= 0 && point.nakshatraIndex < 27)
      }
    }
    assert.equal(base.ascendant.localTimeCorrectionMinutes, 0)
  }],
  ['No-province names apply zero correction in Suriyayatra and preserve the legacy fallback', () => {
    const zero = api.calculateDetailedPositions({ ...input, localTimeCorrectionMinutes: 0 })
    for (const province of ['ไม่ระบุจังหวัด', 'ไม่ใช้จังหวัด']) {
      assert.deepEqual(api.calculateDetailedPositions({ ...input, province }), zero)
      assert.equal(api.calculateDetailedPositions({ ...input, province, localTimeCorrectionMinutes: 24 }).ascendant.localTimeCorrectionMinutes, 24)
      assert.deepEqual(api.generateThaiAstrologyChart({ ...input, province }), api.generateThaiAstrologyChart({ ...input, province, localTimeCorrectionMinutes: 18 }))
    }
  }],
  ['Repeated and same-time transit calculations remain deterministic', () => {
    const first = api.calculateDetailedPositions(input)
    assert.deepEqual(api.calculateDetailedPositions(input), first)
    const transit = api.calculateTransits(input, input)
    assert.ok(Object.values(transit.comparison).every(value => value.longitudeDifferenceDegrees === 0))
    assert.equal(first.calendar.civilWeekday, first.calendar.astrologicalWeekday)
    assert.equal(api.calculateDetailedPositions({ ...input, yearBc: 2200 }).calendar.thaiLunarDate, null)
  }],
]
