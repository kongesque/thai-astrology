'use strict'

const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const api = require('thai-astrology')
const events = require('./fixtures/sunrise-events.json').cases
const reference = { method: 'sunrise', latitude: 13.7563, longitude: 100.5018, utcOffsetHours: 7 }
const input = { yearBc: 2024, monthTh: 6, day: 21, hour: 8, minute: 30, province: 'กรุงเทพมหานคร', ascendantReference: reference }
const structured = { date: { year: 2024, era: 'CE', month: 6, day: 21 }, time: { hour: 8, minute: 30 }, ascendantReference: reference }

module.exports = [
  ['Minute-table sunrise is explicit, bounded and preserved by every chart entry point', () => {
    // Minute-scale public predictions: https://aa.usno.navy.mil/data/RS_OneYear
    // This tests a declared time convention, not improved physical sunrise accuracy.
    const distance = (a, b) => Math.abs(((a - b + 32400) % 21600) - 10800)
    for (const value of events.filter(value => value.expectedSunriseMinutes !== null)) {
      const { yearCe, month, day, latitude, longitude, utcOffsetHours } = value
      const ascendantReference = { method: 'sunrise', latitude, longitude, utcOffsetHours }
      const base = { ...input, yearBc: yearCe, monthTh: month, day, ascendantReference }
      const continuous = api.calculateDetailedPositions(base)
      assert.deepEqual(api.calculateDetailedPositions({ ...base, ascendantReference: { ...ascendantReference, timePrecision: 'continuous' } }), continuous)
      const minute = api.calculateDetailedPositions({ ...base, ascendantReference: { ...ascendantReference, timePrecision: 'minute' } })
      assert.deepEqual(minute.ascendant.sunrise, continuous.ascendant.sunrise)
      assert.equal(minute.ascendant.referenceTimeMinutes, continuous.ascendant.sunrise.roundedTimeMinutes % 1440)
      // The fastest fixed sign lasts 72 minutes: 30 seconds can move at most 12.5′.
      assert.ok(distance(minute.longitudes.ascendant.longitudeArcMinutes, continuous.longitudes.ascendant.longitudeArcMinutes) <= 12.5 + 1e-9)
      for (const key of ['calendar', 'taksa', 'diagnostics', 'sunPosition']) assert.deepEqual(minute[key], continuous[key])
      for (const key of Object.keys(minute.longitudes).filter(key => key !== 'ascendant')) assert.equal(minute.longitudes[key].longitudeArcMinutes, continuous.longitudes[key].longitudeArcMinutes)
      const riseTime = continuous.ascendant.sunrise.roundedTimeMinutes
      if (riseTime < 1440) {
        const atRise = api.calculateDetailedPositions({ ...base, hour: Math.floor(riseTime / 60), minute: riseTime % 60, ascendantReference: { ...ascendantReference, timePrecision: 'minute' } })
        assert.ok(distance(atRise.longitudes.ascendant.longitudeArcMinutes, atRise.longitudes.sun.longitudeArcMinutes) < 1e-9)
      }
    }
    const reference = api.createSunriseReference({ province: 'กรุงเทพมหานคร', utcOffsetHours: 7, timePrecision: 'minute' })
    const withMinute = { ...structured, ascendantReference: reference }
    const chart = api.calculateThaiHoroscope(withMinute)
    assert.equal(chart.input.ascendantReference.timePrecision, 'minute')
    assert.equal(chart.timing.referenceTimeMinutes, chart.timing.sunrise.roundedTimeMinutes % 1440)
    assert.deepEqual(api.generateThaiAstrologyChart({ ...input, method: 'suriyayatra', ascendantReference: reference }).channelOutputs, chart.charts.rasi.channels.thai)
    const transits = api.calculateHoroscopeTransits(withMinute, withMinute)
    assert.equal(transits.natal.points.ascendant.longitudeArcMinutes, transits.transit.points.ascendant.longitudeArcMinutes)
    assert.equal(api.createSunriseReferenceForLocation({ latitude: 13.7563, longitude: 100.5018, utcOffsetHours: 7, timePrecision: 'minute' }).timePrecision, 'minute')
    // Deliberate fixed-offset edge case, not a claimed civil timezone at this coordinate.
    const midnight = api.calculateDetailedPositions({ ...input, ascendantReference: { method: 'sunrise', latitude: 0, longitude: 180, utcOffsetHours: 6.02, timePrecision: 'minute' } })
    assert.ok(midnight.ascendant.sunrise.timeMinutes >= 1439.5 && midnight.ascendant.sunrise.timeMinutes < 1440)
    assert.equal(midnight.ascendant.sunrise.roundedTimeMinutes, 1440)
    assert.equal(midnight.ascendant.referenceTimeMinutes, 0)
    assert.deepEqual(midnight.calendar, api.calculateDetailedPositions({ ...input, ascendantReference: { method: 'sunrise', latitude: 0, longitude: 180, utcOffsetHours: 6.02 } }).calendar)
    for (const timePrecision of [null, 'second', 60, false]) {
      const ascendantReference = { ...reference, timePrecision }
      assert.throws(() => api.calculateDetailedPositions({ ...input, ascendantReference }), /timePrecision/)
      assert.deepEqual(api.validateHoroscopeInput({ ...structured, ascendantReference }).issues.map(issue => issue.field), ['ascendantReference.timePrecision'])
      assert.throws(() => api.createSunriseReference({ province: 'กรุงเทพมหานคร', utcOffsetHours: 7, timePrecision }), /timePrecision/)
    }
  }],
  ['Coordinate sunrise agrees with independent public event data and preserves no-rise dates', () => {
    // USNO public numerical predictions; explicit offsets include any chosen DST.
    // https://aa.usno.navy.mil/data/api and https://aa.usno.navy.mil/faq/RST_defs
    // NOAA documents approximately minute-scale accuracy within ±72° latitude.
    // https://gml.noaa.gov/grad/solcalc/calcdetails.html
    // Distilled facts only: no captured response metadata or private chart records.
    for (const { expectedSunriseMinutes, ...value } of events) {
      const sunrise = api.calculateSunrise(value)
      assert.equal(sunrise.horizonAltitudeDegrees, -50 / 60)
      if (expectedSunriseMinutes === null) assert.equal(sunrise.status, 'no-rise')
      else {
        assert.equal(sunrise.status, 'rise')
        assert.ok(Math.abs(sunrise.roundedTimeMinutes - expectedSunriseMinutes) <= 1)
        assert.ok(sunrise.timeMinutes >= 0 && sunrise.timeMinutes < 1440)
        assert.ok(Math.abs(sunrise.altitudeResidualDegrees) <= 0.00001)
      }
    }
    const summer = api.calculateSunrise({ yearCe: 2024, month: 6, day: 21, ...reference })
    const winter = api.calculateSunrise({ yearCe: 2024, month: 12, day: 21, ...reference })
    assert.equal(summer.roundedTimeMinutes, 352)
    assert.equal(winter.roundedTimeMinutes, 397)
    assert.notEqual(summer.timeMinutes, summer.roundedTimeMinutes)
    assert.notEqual(summer.timeMinutes, winter.timeMinutes)
  }],
  ['Seasonal reference changes classical chart relationships without changing planets or calendar clocks', () => {
    for (const value of events.filter(value => value.expectedSunriseMinutes !== null)) {
      const { yearCe, month, day, latitude, longitude, utcOffsetHours } = value
      const base = { ...input, yearBc: yearCe, monthTh: month, day, ascendantReference: undefined }
      const traditional = api.calculateDetailedPositions(base)
      const chart = api.calculateDetailedPositions({ ...base, ascendantReference: { method: 'sunrise', latitude, longitude, utcOffsetHours } })
      for (const key of ['calendar', 'diagnostics', 'taksa', 'sunPosition']) assert.deepEqual(chart[key], traditional[key])
      for (const key of Object.keys(chart.longitudes).filter(key => key !== 'ascendant')) {
        assert.equal(chart.longitudes[key].longitudeArcMinutes, traditional.longitudes[key].longitudeArcMinutes)
        assert.equal(chart.longitudes[key].house, ((chart.positions[key] - chart.positions.ascendant + 12) % 12) + 1)
      }
      assert.equal(chart.ascendant.referenceTimeMinutes, chart.ascendant.sunrise.timeMinutes)
      assert.equal(chart.ascendant.localTimeCorrectionMinutes, 0)
      assert.deepEqual(JSON.parse(JSON.stringify(chart)), chart)
    }
    const chart = api.calculateDetailedPositions(input)
    for (const province of ['เชียงใหม่', 'custom', 'ไม่ระบุจังหวัด']) assert.deepEqual(api.calculateDetailedPositions({ ...input, province }), chart)
    assert.deepEqual(api.calculateDetailedPositions({ ...input, yearBc: undefined, yearBe: 2567 }), chart)
    const web = api.calculateThaiHoroscope({ ...structured, location: { province: 'custom' } })
    assert.deepEqual(web.points.ascendant.longitudeArcMinutes, chart.longitudes.ascendant.longitudeArcMinutes)
    assert.equal(web.input.location.localTimeCorrectionMinutes, 0)
    assert.equal(web.factors.ascendantRuler, web.houses[0].ruler.key)
    assert.deepEqual(api.generateThaiAstrologyChart({ ...input, method: 'suriyayatra' }).channelOutputs, chart.channelOutputs)
    assert.equal(api.calculateHoroscopeTransits(structured, structured).comparison.sun.longitudeDifferenceDegrees, 0)
  }],
  ['Coordinate reference validation requires an offset and rejects double corrections and unsupported dates', () => {
    for (const patch of [
      { method: 'fixed' }, { latitude: 91 }, { latitude: NaN }, { latitude: '13' },
      { longitude: -181 }, { utcOffsetHours: undefined }, { utcOffsetHours: Infinity }, { utcOffsetHours: 15 },
    ]) {
      const ascendantReference = { ...reference, ...patch }
      assert.throws(() => api.calculateDetailedPositions({ ...input, ascendantReference }), RangeError)
      assert.equal(api.validateHoroscopeInput({ ...structured, ascendantReference }).valid, false)
    }
    for (const ascendantReference of [null, [], 'sunrise']) {
      assert.throws(() => api.calculateDetailedPositions({ ...input, ascendantReference }), TypeError)
      assert.equal(api.validateHoroscopeInput({ ...structured, ascendantReference }).valid, false)
    }
    const missingOffset = api.validateHoroscopeInput({ ...structured, ascendantReference: { method: 'sunrise', latitude: 0, longitude: 0 } })
    assert.equal(missingOffset.valid, false)
    assert.deepEqual(missingOffset.issues.map(issue => issue.field), ['ascendantReference.utcOffsetHours'])
    assert.throws(() => api.calculateDetailedPositions({ ...input, localTimeCorrectionMinutes: 18 }), /already includes/)
    assert.throws(() => api.generateThaiAstrologyChart(input), /requires the suriyayatra/)
    assert.equal(api.validateHoroscopeInput({ ...structured, location: { localTimeCorrectionMinutes: 18 } }).valid, false)
    assert.deepEqual(api.calculateDetailedPositions({ ...input, localTimeCorrectionMinutes: 0 }), api.calculateDetailedPositions(input))
    for (const year of [1899, 2101]) {
      assert.throws(() => api.calculateDetailedPositions({ ...input, yearBc: year }), /1900..2100/)
      assert.equal(api.validateHoroscopeInput({ ...structured, date: { ...structured.date, year } }).valid, false)
    }
    assert.throws(() => api.calculateSunrise({ yearCe: 2100, month: 2, day: 29, ...reference }), RangeError)
    const polar = { ...reference, latitude: 69.6492, longitude: 18.9553, utcOffsetHours: 2 }
    assert.throws(() => api.calculateThaiHoroscope({ ...structured, ascendantReference: polar }), /No sunrise/)
    const { ascendantReference, ...traditional } = input
    assert.equal(api.calculateDetailedPositions(traditional).ascendant.sunrise, undefined)
    assert.equal(api.calculateDetailedPositions(traditional).ascendant.referenceTimeMinutes, 378)
  }],
  ['Explicit civil offsets, including historical seconds, do not depend on the host timezone', () => {
    // IANA tzdata 2025b: civil Bangkok offset was +06:42:04 before April 1920.
    // https://github.com/eggert/tz/blob/2025b/asia#L3860-L3862
    const historical = { yearCe: 1900, month: 6, day: 21, ...reference, utcOffsetHours: 6 + 42 / 60 + 4 / 3600 }
    const old = api.calculateSunrise(historical)
    assert.equal(old.status, 'rise')
    assert.equal(old.roundedTimeMinutes, 333)
    const script = `const api=require('thai-astrology');process.stdout.write(JSON.stringify(${JSON.stringify(events)}.map(({expectedSunriseMinutes,...input})=>api.calculateSunrise(input))))`
    const results = ['UTC', 'Asia/Bangkok', 'America/New_York', 'Pacific/Apia'].map(TZ =>
      execFileSync(process.execPath, ['-e', script], { env: { ...process.env, TZ }, encoding: 'utf8' }))
    for (const result of results.slice(1)) assert.equal(result, results[0])
  }],
]
