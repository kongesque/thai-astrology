'use strict'

const assert = require('node:assert/strict')
const api = require('thai-astrology')
const input = { date: { year: 2024, era: 'CE', month: 9, day: 15 }, time: { hour: 8, minute: 30 }, location: { province: 'เชียงใหม่' } }

module.exports = [
  ['Web results serialize and keep point, house and ruler relationships consistent', () => {
    const chart = api.calculateThaiHoroscope(input)
    assert.deepEqual(JSON.parse(JSON.stringify(chart)), chart)
    assert.equal(chart.houses.length, 12)
    assert.equal(Object.keys(chart.points).length, 11)
    assert.equal(chart.points.ascendant.number, null)
    assert.equal(chart.points.uranus.number, 0)
    for (const [key, point] of Object.entries(chart.points)) {
      const house = chart.houses[point.house - 1]
      assert.equal(house.sign, point.sign)
      if (key !== 'ascendant') assert.ok(house.occupants.includes(key))
      assert.deepEqual(point.ruledHouses, chart.houses.filter(value => value.ruler.key === key).map(value => value.number))
    }
    assert.equal(chart.factors.ascendantRuler, chart.houses[0].ruler.key)
    assert.deepEqual(chart.factors.ascendantOccupants, chart.houses[0].occupants)
    assert.equal(chart.charts.rasi.channels.arabic.length, 12)
    assert.deepEqual(api.calculateThaiHoroscope({ ...input, date: { ...input.date, era: 'BE', year: 2567 } }), chart)
  }],
  ['Form errors are structured and dropdown records cannot mutate the engine', () => {
    for (const value of [null, [], '2024-09-15', {}, { date: null, time: [] }]) assert.equal(api.validateHoroscopeInput(value).valid, false)
    const invalid = { ...input, date: { year: 2100, era: 'CE', month: 2, day: 29 }, time: { hour: '8', minute: 60 } }
    const validation = api.validateHoroscopeInput(invalid)
    assert.equal(validation.valid, false)
    assert.deepEqual(validation.issues.map(issue => issue.field), ['time.hour', 'time.minute', 'date.day'])
    assert.throws(() => api.calculateThaiHoroscope(invalid), error => error instanceof api.HoroscopeInputError && error.issues.length === 3)
    assert.equal(api.validateHoroscopeInput({ ...input, location: { province: 'toString' } }).valid, false)
    assert.equal(api.validateHoroscopeInput({ ...input, location: { province: 'custom', localTimeCorrectionMinutes: 24 } }).valid, true)
    const provinces = api.getThaiAstrologyProvinces()
    const original = provinces[0].localTimeCorrectionMinutes
    provinces[0].localTimeCorrectionMinutes = 999
    assert.equal(api.getThaiAstrologyProvinces()[0].localTimeCorrectionMinutes, original)
  }],
  ['No-province names are accepted without changing the omitted-location result', () => {
    const { location, ...withoutLocation } = input
    const omitted = api.calculateThaiHoroscope(withoutLocation)
    assert.equal(omitted.input.location.province, 'ไม่ใช้จังหวัด')
    assert.equal(omitted.input.location.localTimeCorrectionMinutes, 0)
    for (const province of ['ไม่ระบุจังหวัด', 'ไม่ใช้จังหวัด']) {
      const chart = api.calculateThaiHoroscope({ ...withoutLocation, location: { province } })
      assert.deepEqual(chart, { ...omitted, input: { ...omitted.input, location: { province, localTimeCorrectionMinutes: 0 } } })
      assert.equal(api.calculateThaiHoroscope({ ...withoutLocation, location: { province, localTimeCorrectionMinutes: 24 } }).input.location.localTimeCorrectionMinutes, 24)
    }
  }],
  ['Transit results use explicit dates and natal houses', () => {
    const result = api.calculateHoroscopeTransits(input, { ...input, date: { ...input.date, day: 16 } })
    assert.equal(result.natal.input.date.day, 15)
    assert.equal(result.transit.input.date.day, 16)
    for (const [key, comparison] of Object.entries(result.comparison)) {
      assert.equal(comparison.natalHouse, ((result.transit.points[key].sign - result.natal.points.ascendant.sign + 12) % 12) + 1)
      assert.ok(comparison.longitudeDifferenceDegrees >= -180 && comparison.longitudeDifferenceDegrees < 180)
    }
  }],
]
