'use strict'

const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const api = require('thai-astrology')
const { executeThaiAstrologyTool } = require('thai-astrology/tools')
const base = { date: { year: 2024, era: 'CE', month: 6, day: 21 }, time: { hour: 8, minute: 30 } }
const location = (countryCode, query) => api.searchThaiAstrologyLocations({ countryCode, query, limit: 1 }).items[0]

module.exports = [
  ['Birthplace resolution prepares explicit foreign clocks and ready horoscope input', () => {
    const city = location('US', 'New York')
    const request = { ...base, location: { locationId: city.id, countryCode: 'US' } }
    const resolved = api.resolveHoroscopeBirthplace(request)
    assert.equal(resolved.location.timeZone, 'America/New_York')
    assert.equal(resolved.civilTime.source, 'iana')
    assert.equal(resolved.civilTime.utcOffsetSeconds, -14400)
    assert.equal(resolved.civilTime.ambiguous, false)
    assert.equal(resolved.civilTime.utcEpochMilliseconds, 1718973000000)
    assert.deepEqual(resolved.input.planetaryTimeReference, { civilUtcOffsetSeconds: -14400, referenceUtcOffsetSeconds: 24124 })
    assert.equal(resolved.input.ascendantReference.timePrecision, 'minute')
    assert.equal(api.validateHoroscopeInput(resolved.input).valid, true)
    const chart = api.calculateThaiHoroscope(resolved.input)
    assert.equal(chart.profile.referenceMode, 'explicit')
    assert.equal(chart.timing.sunrise.roundedTimeMinutes, 325)
    assert.deepEqual(executeThaiAstrologyTool('resolve_birthplace', request).data, resolved)
    const winter = api.resolveHoroscopeBirthplace({ ...request, date: { ...base.date, month: 12 } })
    assert.equal(winter.civilTime.utcOffsetSeconds, -18000)
    assert.equal(api.resolveHoroscopeBirthplace({ ...base, location: { locationId: location('NP', 'Kathmandu').id } }).civilTime.utcOffsetSeconds, 20700)
    const be = api.resolveHoroscopeBirthplace({ ...request, date: { ...base.date, year: 2567, era: 'BE' } })
    assert.deepEqual(api.calculateThaiHoroscope(be.input).points, chart.points)
    resolved.location.latitude = 0
    assert.notEqual(api.resolveHoroscopeBirthplace(request).location.latitude, 0)
  }],
  ['Birthplace offsets agree with independent IANA fixtures and require DST choices', () => {
    for (const fixture of require('./fixtures/civil-time-offsets.json').cases) {
      const { yearCe, month, day, hour, minute } = fixture.civilTime
      const request = { date: { year: yearCe, era: 'CE', month, day }, time: { hour, minute }, location: { latitude: 0, longitude: 0, timeZone: fixture.timeZone } }
      if (!fixture.candidates.length) {
        assert.throws(() => api.resolveHoroscopeBirthplace(request), /does not exist/)
        assert.equal(executeThaiAstrologyTool('resolve_birthplace', request).error.code, 'INVALID_BIRTHPLACE')
        continue
      }
      if (fixture.candidates.length > 1) {
        const error = executeThaiAstrologyTool('resolve_birthplace', request).error
        assert.equal(error.code, 'AMBIGUOUS_CIVIL_TIME')
        assert.equal(error.issues[0].field, 'disambiguation')
      }
      for (const [choice, expected] of [['earlier', fixture.candidates[0]], ['later', fixture.candidates[fixture.candidates.length - 1]]]) {
        const result = api.resolveHoroscopeBirthplace({ ...request, disambiguation: choice })
        assert.equal(result.civilTime.utcEpochMilliseconds, expected.utcEpochMilliseconds)
        assert.ok(Math.abs(result.civilTime.utcOffsetSeconds / 3600 - expected.utcOffsetHours) < 1e-12)
      }
    }
  }],
  ['Birthplace overrides retain precise coordinates and never infer their timezone', () => {
    const city = location('US', 'New York')
    const precise = { locationId: city.id, latitude: 40.7128, longitude: -74.006 }
    assert.throws(() => api.resolveHoroscopeBirthplace({ ...base, location: precise }), /explicit IANA/)
    const resolved = api.resolveHoroscopeBirthplace({ ...base, location: { ...precise, timeZone: city.timeZone }, referenceUtcOffsetSeconds: 0, timePrecision: 'continuous' })
    assert.equal(resolved.location.coordinateKind, 'coordinates')
    assert.equal(resolved.input.ascendantReference.latitude, precise.latitude)
    assert.equal(resolved.input.ascendantReference.timePrecision, 'continuous')
    assert.equal(resolved.input.planetaryTimeReference.referenceUtcOffsetSeconds, 0)
    const manual = { ...base, location: { latitude: 40.7128, longitude: -74.006, utcOffsetHours: -4 } }
    const script = `global.Intl=undefined;process.stdout.write(JSON.stringify(require('thai-astrology').resolveHoroscopeBirthplace(${JSON.stringify(manual)})))`
    const value = JSON.parse(execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' }))
    assert.equal(value.civilTime.source, 'explicit-offset')
    assert.equal(value.civilTime.ambiguous, null)
    assert.equal(value.civilTime.utcOffsetSeconds, -14400)
    assert.equal(api.calculateThaiHoroscope(value.input).profile.referenceMode, 'explicit')
    const polar = api.resolveHoroscopeBirthplace({ ...base, location: { latitude: 89, longitude: 0, utcOffsetHours: 0 } })
    assert.throws(() => api.calculateThaiHoroscope(polar.input), /sunrise/)
  }],
  ['Thai birthplace resolution preserves automatic chart factors and historical seconds', () => {
    const city = location('TH', 'Chiang Mai')
    const resolved = api.resolveHoroscopeBirthplace({ ...base, location: { locationId: city.id } })
    const automatic = api.calculateThaiHoroscope({ ...base, location: { province: city.provinceCode } })
    assert.equal(resolved.input.location.province, 'TH-50')
    assert.deepEqual(api.calculateThaiHoroscope(resolved.input).points, automatic.points)
    const historical = api.resolveHoroscopeBirthplace({ ...base, date: { ...base.date, year: 1900 }, location: { locationId: city.id } })
    assert.equal(historical.civilTime.utcOffsetSeconds, 24124)
    assert.equal(historical.input.planetaryTimeReference.civilUtcOffsetSeconds, 24124)
    const extra = api.resolveHoroscopeBirthplace({ ...base, time: { ...base.time, yearCe: 1900, month: 1 }, location: { locationId: city.id } })
    assert.deepEqual(extra, resolved)
  }],
  ['Birthplace resolution rejects invalid civil input, mismatched countries and conflicting clocks', () => {
    const city = location('US', 'New York')
    for (const request of [
      { ...base, location: {} },
      { ...base, location: { locationId: 'unknown' } },
      { ...base, location: { locationId: city.id, countryCode: 'TH' } },
      { ...base, location: { latitude: 0 } },
      { ...base, location: { latitude: 91, longitude: 0, utcOffsetHours: 0 } },
      { ...base, location: { latitude: 0, longitude: 0, utcOffsetHours: 0.00001 } },
      { ...base, location: { locationId: city.id, utcOffsetHours: -4 }, disambiguation: 'later' },
      { ...base, date: { ...base.date, year: 1899 }, location: { locationId: city.id } },
    ]) assert.throws(() => api.resolveHoroscopeBirthplace(request), api.BirthplaceResolutionError)
    const invalid = executeThaiAstrologyTool('resolve_birthplace', { ...base, date: { ...base.date, month: 2, day: 30 }, location: { locationId: city.id } })
    assert.equal(invalid.error.code, 'INVALID_INPUT')
    assert.equal(executeThaiAstrologyTool('resolve_birthplace', { ...base, location: { locationId: city.id }, referenceUtcOffsetSeconds: 50401 }).error.code, 'INVALID_INPUT')
    assert.equal(executeThaiAstrologyTool('resolve_birthplace', { ...base, location: { locationId: city.id }, extra: true }).error.code, 'INVALID_ARGUMENTS')
  }],
]
