'use strict'

const assert = require('node:assert/strict')
const api = require('thai-astrology')
const base = { date: { year: 2024, era: 'CE', month: 6, day: 21 }, time: { hour: 8, minute: 30 } }

module.exports = [
  ['Province dropdown covers the existing 77 names with public provincial-seat points', () => {
    const locations = api.getThaiAstrologyProvinceLocations()
    assert.deepEqual(locations.map(row => row.province), api.getThaiAstrologyProvinces().map(row => row.province))
    assert.equal(new Set(locations.map(row => row.geonameId)).size, 77)
    // GeoNames public numerical facts: https://www.geonames.org/1609350/ and /1608133/.
    assert.deepEqual(locations.find(row => row.province === 'กรุงเทพมหานคร'), {
      province: 'กรุงเทพมหานคร', countryCode: 'TH', latitude: 13.75398, longitude: 100.50144,
      timeZone: 'Asia/Bangkok', coordinateKind: 'province-seat', geonameId: 1609350,
    })
    const nonthaburi = locations.find(row => row.province === 'นนทบุรี')
    assert.equal(nonthaburi.geonameId, 1608133)
    assert.equal(nonthaburi.latitude, 13.86075)
    for (const row of locations) {
      assert.equal(row.countryCode, 'TH')
      assert.equal(row.coordinateKind, 'province-seat')
      const ref = api.createSunriseReference({ province: row.province, utcOffsetHours: 7 })
      assert.equal(ref.latitude, row.latitude)
      assert.equal(ref.longitude, row.longitude)
      const summer = api.calculateThaiHoroscope({ ...base, ascendantReference: ref })
      const winter = api.calculateThaiHoroscope({ ...base, date: { ...base.date, month: 12 }, ascendantReference: ref })
      assert.notEqual(summer.timing.sunrise.timeMinutes, winter.timing.sunrise.timeMinutes)
      assert.equal(summer.timing.localTimeCorrectionMinutes, 0)
    }
    locations[0].latitude = 90
    locations.splice(1)
    assert.equal(api.getThaiAstrologyProvinceLocations().length, 77)
    assert.notEqual(api.getThaiAstrologyProvinceLocations()[0].latitude, 90)
  }],
  ['Precise coordinates override province defaults and a country label is optional', () => {
    const precise = { latitude: 13.7563, longitude: 100.5018, utcOffsetHours: 7 }
    const ref = api.createSunriseReference({ province: 'กรุงเทพมหานคร', countryCode: 'TH', ...precise })
    assert.deepEqual(ref, { method: 'sunrise', ...precise })
    assert.deepEqual(api.calculateThaiHoroscope({ ...base, ascendantReference: ref }), api.calculateThaiHoroscope({ ...base, ascendantReference: { method: 'sunrise', ...precise } }))
    const foreign = { latitude: 12.36566, longitude: -1.53388, utcOffsetHours: 0 }
    assert.deepEqual(api.createSunriseReference({ countryCode: 'BF', ...foreign }), api.createSunriseReference(foreign))
    const foreignChart = api.calculateThaiHoroscope({ ...base, ascendantReference: api.createSunriseReference({ countryCode: 'BF', ...foreign }) })
    assert.equal(foreignChart.timing.sunrise.status, 'rise')
    const newYork = { countryCode: 'US', latitude: 40.7128, longitude: -74.006, utcOffsetHours: -4 }
    const sunrise = api.calculateSunrise({ yearCe: 2024, month: 6, day: 21, ...api.createSunriseReference(newYork) })
    assert.equal(sunrise.roundedTimeMinutes, 325) // Retained public USNO event: 05:25 EDT.
    const noDst = api.calculateSunrise({ yearCe: 2024, month: 6, day: 21, ...api.createSunriseReference({ ...newYork, utcOffsetHours: -5 }) })
    assert.ok(Math.abs(sunrise.timeMinutes - noDst.timeMinutes - 60) < 0.0001)
  }],
  ['Country dropdown contains 250 current country/territory labels without guessed locations', () => {
    const countries = api.getThaiAstrologyCountries()
    assert.equal(countries.length, 250)
    assert.equal(new Set(countries.map(row => row.countryCode)).size, 250)
    assert.deepEqual(countries.find(row => row.countryCode === 'BF'), { countryCode: 'BF', nameEnglish: 'Burkina Faso' })
    assert.ok(countries.some(row => row.countryCode === 'XK'))
    assert.ok(!countries.some(row => row.countryCode === 'CS' || row.countryCode === 'AN'))
    assert.ok(countries.every(row => /^[A-Z]{2}$/.test(row.countryCode) && row.nameEnglish.trim() === row.nameEnglish))
    countries[0].nameEnglish = 'modified'
    countries.pop()
    assert.equal(api.getThaiAstrologyCountries().length, 250)
    assert.notEqual(api.getThaiAstrologyCountries()[0].nameEnglish, 'modified')
  }],
  ['Selection rejects partial coordinates, conflicting labels and absent offsets', () => {
    for (const value of [null, [], 'TH']) assert.throws(() => api.createSunriseReference(value), TypeError)
    for (const selection of [
      {}, { countryCode: 'BF' }, { province: 'กรุงเทพมหานคร' },
      { province: 'unknown', utcOffsetHours: 7 }, { province: 'กรุงเทพมหานคร', countryCode: 'US', utcOffsetHours: -4 },
      { province: 'กรุงเทพมหานคร', latitude: 13, utcOffsetHours: 7 },
      { province: 'กรุงเทพมหานคร', longitude: 100, utcOffsetHours: 7 },
      { latitude: 0, longitude: 0, utcOffsetHours: 0, countryCode: 'ZZ' },
      { latitude: 0, longitude: 0, utcOffsetHours: 0, countryCode: 'th' },
      { latitude: 91, longitude: 0, utcOffsetHours: 0 },
      { latitude: '13', longitude: 100, utcOffsetHours: 7 },
      { latitude: 0, longitude: NaN, utcOffsetHours: 0 },
      { latitude: 0, longitude: 0, utcOffsetHours: 15 },
    ]) assert.throws(() => api.createSunriseReference(selection), RangeError)
    const historical = api.createSunriseReference({ province: 'กรุงเทพมหานคร', utcOffsetHours: 6 + 42 / 60 + 4 / 3600 })
    assert.equal(historical.utcOffsetHours, 6 + 42 / 60 + 4 / 3600)
    const ref = api.createSunriseReference({ latitude: 69.6492, longitude: 18.9553, utcOffsetHours: 2, countryCode: 'NO' })
    assert.equal(api.calculateSunrise({ yearCe: 2024, month: 6, day: 21, ...ref }).status, 'no-rise')
  }],
]
