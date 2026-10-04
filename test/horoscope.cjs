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
  ['Province-only horoscopes select daily minute sunrise and historical planetary time', () => {
    const chart = api.calculateThaiHoroscope(input)
    assert.equal(chart.profile.referenceMode, 'auto')
    assert.equal(chart.input.referenceMode, 'auto')
    assert.equal(chart.input.location.localTimeCorrectionMinutes, 0)
    assert.equal(chart.input.ascendantReference.timePrecision, 'minute')
    assert.deepEqual(chart.input.planetaryTimeReference, { civilUtcOffsetSeconds: 25200, referenceUtcOffsetSeconds: 24124 })
    assert.equal(chart.timing.referenceTimeMinutes, chart.timing.sunrise.roundedTimeMinutes)
    assert.equal(chart.points.sun.minutes, 56)
    const validation = api.validateHoroscopeInput(input)
    assert.equal(validation.valid, true)
    assert.deepEqual(validation.value, chart.input)
    for (const seat of api.getThaiAstrologyProvinceLocations()) {
      const resolved = api.validateHoroscopeInput({ ...input, location: { province: seat.province } })
      assert.equal(resolved.valid, true)
      assert.equal(resolved.value.ascendantReference.latitude, seat.latitude)
      assert.equal(resolved.value.ascendantReference.longitude, seat.longitude)
    }
  }],
  ['Automatic provincial settings retain historical offset seconds and clock-gap rejection', () => {
    // IANA Asia/Bangkok: +06:42:04 until April 1920, then +07:00.
    // https://data.iana.org/time-zones/tzdb-2025b/asia
    const historical = api.calculateThaiHoroscope({ ...input, date: { year: 1900, era: 'CE', month: 6, day: 21 }, location: { province: 'กรุงเทพมหานคร' } })
    assert.equal(historical.input.planetaryTimeReference.civilUtcOffsetSeconds, 24124)
    assert.equal(historical.input.ascendantReference.utcOffsetHours * 3600, 24124)
    assert.equal(historical.timing.sunrise.roundedTimeMinutes, 333)
    const gap = api.validateHoroscopeInput({ ...input, date: { year: 1920, era: 'CE', month: 4, day: 1 }, time: { hour: 0, minute: 10 } })
    assert.equal(gap.valid, false)
    assert.equal(gap.issues[0].field, 'time')
    assert.match(gap.issues[0].message, /does not exist/)
    const extra = api.calculateThaiHoroscope({ ...input, time: { ...input.time, yearCe: 1900, month: 1, day: 1 } })
    assert.deepEqual(extra, api.calculateThaiHoroscope(input))
  }],
  ['Traditional mode preserves the earlier structured calculation and validates the selector', () => {
    const chart = api.calculateThaiHoroscope({ ...input, referenceMode: 'traditional' })
    const detailed = api.calculateDetailedPositions({ yearBc: 2024, monthTh: 9, day: 15, hour: 8, minute: 30, province: 'เชียงใหม่' })
    assert.equal(chart.profile.referenceMode, 'traditional')
    assert.equal(chart.profile.referenceFallback, undefined)
    assert.equal(chart.input.ascendantReference, undefined)
    assert.equal(chart.input.planetaryTimeReference, undefined)
    assert.deepEqual(chart.charts.rasi.channels.thai, detailed.channelOutputs)
    for (const [key, point] of Object.entries(chart.points)) assert.equal(point.longitudeArcMinutes, detailed.longitudes[key].longitudeArcMinutes)
    assert.equal(chart.points.sun.minutes, 57)
    for (const referenceMode of [null, 'best', false, 1]) {
      const validation = api.validateHoroscopeInput({ ...input, referenceMode })
      assert.equal(validation.valid, false)
      assert.deepEqual(validation.issues.map(issue => issue.field), ['referenceMode'])
    }
  }],
  ['Automatic references report fallback instead of guessing absent locations or unsupported years', () => {
    for (const year of [1782, 1899, 2101]) {
      const chart = api.calculateThaiHoroscope({ ...input, date: { year, era: 'CE', month: 4, day: 21 } })
      assert.equal(chart.profile.referenceMode, 'traditional')
      assert.equal(chart.profile.referenceFallback, 'year-out-of-range')
      assert.equal(chart.input.ascendantReference, undefined)
    }
    const { location, ...withoutLocation } = input
    assert.equal(api.calculateThaiHoroscope(withoutLocation).profile.referenceFallback, 'missing-province')
    for (const localTimeCorrectionMinutes of [0, 24]) {
      const chart = api.calculateThaiHoroscope({ ...input, location: { province: 'custom', localTimeCorrectionMinutes } })
      assert.equal(chart.profile.referenceFallback, 'explicit-correction')
      assert.equal(chart.input.location.localTimeCorrectionMinutes, localTimeCorrectionMinutes)
    }
    const historic = api.calculateThaiHoroscope({ date: { year: 2325, era: 'BE', month: 4, day: 21 }, time: { hour: 6, minute: 54 }, location: { province: 'กรุงเทพมหานคร' } })
    assert.equal(historic.points.sun.degrees, 10)
    assert.equal(historic.points.sun.minutes, 42)
    assert.equal(historic.points.ascendant.signName, 'เมษ')
  }],
  ['Explicit references preserve continuous sunrise and sunrise-only civil planetary clocks', () => {
    const ascendantReference = api.createSunriseReference({ province: 'เชียงใหม่', utcOffsetHours: 7 })
    const chart = api.calculateThaiHoroscope({ ...input, ascendantReference })
    assert.equal(chart.profile.referenceMode, 'explicit')
    assert.equal(chart.input.planetaryTimeReference, undefined)
    assert.equal(chart.input.ascendantReference.timePrecision, undefined)
    assert.equal(chart.points.sun.minutes, 57)
    assert.equal(chart.timing.referenceTimeMinutes, chart.timing.sunrise.timeMinutes)
    const planetaryTimeReference = { civilUtcOffsetSeconds: 25200, referenceUtcOffsetSeconds: 24124 }
    const framed = api.calculateThaiHoroscope({ ...input, planetaryTimeReference })
    assert.equal(framed.profile.referenceMode, 'explicit')
    assert.equal(framed.input.ascendantReference, undefined)
    assert.deepEqual(framed.input.planetaryTimeReference, planetaryTimeReference)
  }],
  ['Natal and transit charts independently resolve automatic and traditional references', () => {
    const traditional = { ...input, referenceMode: 'traditional', date: { ...input.date, day: 16 } }
    const result = api.calculateHoroscopeTransits(input, traditional)
    assert.deepEqual(result.natal, api.calculateThaiHoroscope(input))
    assert.deepEqual(result.transit, api.calculateThaiHoroscope(traditional))
    assert.equal(result.natal.profile.referenceMode, 'auto')
    assert.equal(result.transit.profile.referenceMode, 'traditional')
  }],
]
