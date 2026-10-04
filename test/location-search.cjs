'use strict'
const assert = require('node:assert/strict')
const cp = require('node:child_process')
const api = require('thai-astrology')
const civilTime = { yearCe: 2024, month: 6, day: 21, hour: 8, minute: 30 }
const newYork = () => api.searchThaiAstrologyLocations({ countryCode: 'US', query: 'New York' }).items[0]

module.exports = [
  ['Country-scoped location search supports names, pagination and independent result records', () => {
    const ny = newYork()
    assert.equal(ny.nameEnglish, 'New York City')
    assert.equal(ny.geonameId, 5128581)
    assert.equal(ny.timeZone, 'America/New_York')
    assert.equal(api.searchThaiAstrologyLocations({ countryCode: 'CA', query: 'New York' }).total, 0)
    assert.equal(api.searchThaiAstrologyLocations({ countryCode: 'NP', query: 'Kathmandu' }).total, 1)
    assert.equal(api.searchThaiAstrologyLocations({ countryCode: 'BF', query: 'Ouagadougou' }).total, 1)
    const thai = api.searchThaiAstrologyLocations({ countryCode: 'TH', limit: 100 })
    assert.equal(thai.items.filter(row => row.coordinateKind === 'province-seat').length, 77)
    assert.equal(api.searchThaiAstrologyLocations({ countryCode: 'TH', query: 'กรุงเทพ' }).items[0].nameEnglish, 'Bangkok')
    assert.equal(api.searchThaiAstrologyLocations({ countryCode: 'TH', query: 'bangkok' }).items[0].nameThai, 'กรุงเทพมหานคร')
    assert.equal(api.searchThaiAstrologyLocations({ countryCode: 'IS', query: 'reykjavik' }).items[0].nameEnglish, 'Reykjavík')
    const first = api.searchThaiAstrologyLocations({ countryCode: 'US', limit: 3 })
    const next = api.searchThaiAstrologyLocations({ countryCode: 'US', limit: 3, offset: 3 })
    assert.deepEqual([...first.items, ...next.items], api.searchThaiAstrologyLocations({ countryCode: 'US', limit: 6 }).items)
    assert.equal(first.total, next.total)
    assert.equal(api.searchThaiAstrologyLocations({ countryCode: 'US', offset: first.total }).items.length, 0)
    ny.latitude = 0
    assert.notEqual(newYork().latitude, 0)
    for (const input of [{}, { countryCode: 'us' }, { countryCode: 'ZZ' }, { countryCode: 'US', query: 0 }, { countryCode: 'US', query: 'x'.repeat(201) }, { countryCode: 'US', limit: 0 }, { countryCode: 'US', limit: 101 }, { countryCode: 'US', offset: -1 }]) {
      assert.throws(() => api.searchThaiAstrologyLocations(input), RangeError)
    }
  }],
  ['Selected cities resolve civil offsets for birth dates, with precise coordinate and manual overrides', () => {
    const locationId = newYork().id
    const summer = api.createSunriseReferenceForLocation({ locationId, countryCode: 'US', civilTime })
    assert.equal(summer.utcOffsetHours, -4)
    const winter = api.createSunriseReferenceForLocation({ locationId, civilTime: { ...civilTime, month: 12 } })
    assert.equal(winter.utcOffsetHours, -5)
    const chart = api.calculateThaiHoroscope({ date: { year: 2024, era: 'CE', month: 6, day: 21 }, time: { hour: 8, minute: 30 }, ascendantReference: summer })
    assert.equal(chart.timing.sunrise.roundedTimeMinutes, 325)
    assert.deepEqual(api.createSunriseReferenceForLocation({ locationId, utcOffsetHours: -4 }), summer)
    const precise = { latitude: 40.7128, longitude: -74.006 }
    assert.deepEqual(api.createSunriseReferenceForLocation({ locationId, ...precise, timeZone: 'America/New_York', civilTime }), { method: 'sunrise', ...precise, utcOffsetHours: -4 })
    assert.deepEqual(api.createSunriseReferenceForLocation({ ...precise, utcOffsetHours: -4 }), { method: 'sunrise', ...precise, utcOffsetHours: -4 })
    for (const input of [
      {}, { countryCode: 'US' }, { locationId: 'unknown', utcOffsetHours: -4 },
      { locationId, countryCode: 'CA', civilTime }, { locationId },
      { locationId, ...precise, civilTime }, { locationId, latitude: 1, utcOffsetHours: -4 },
      { locationId, latitude: 91, longitude: 0, utcOffsetHours: -4 },
      { locationId, utcOffsetHours: null }, { locationId, utcOffsetHours: '-4' },
    ]) assert.throws(() => api.createSunriseReferenceForLocation(input), RangeError)
    // Manual offsets work even where Intl is absent; the core never invokes this adapter.
    const script = `global.Intl=undefined;const a=require('thai-astrology');process.stdout.write(JSON.stringify(a.createSunriseReferenceForLocation(${JSON.stringify({ locationId, utcOffsetHours: -4 })})))`
    assert.deepEqual(JSON.parse(cp.execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' })), summer)
  }],
  ['Civil timezone adapter rejects clock gaps and requires a choice for repeated times', () => {
    for (const { civilTime: value, timeZone, candidates } of require('./fixtures/civil-time-offsets.json').cases) {
      if (!candidates.length) assert.throws(() => api.resolveCivilTimeOffset(value, timeZone), /does not exist/)
      else {
        if (candidates.length > 1) assert.throws(() => api.resolveCivilTimeOffset(value, timeZone), /ambiguous/)
        for (const [choice, expected] of [['earlier', candidates[0]], ['later', candidates[candidates.length - 1]]]) {
          const actual = api.resolveCivilTimeOffset(value, timeZone, choice)
          assert.equal(actual.utcEpochMilliseconds, expected.utcEpochMilliseconds)
          assert.ok(Math.abs(actual.utcOffsetHours - expected.utcOffsetHours) < 1e-12)
        }
      }
    }
    // IANA US rules (2007+), Australia/Lord_Howe rules and Pacific/Apia's 2011 skip.
    // https://data.iana.org/time-zones/tzdb-2025b/northamerica
    // https://data.iana.org/time-zones/tzdb-2025b/australasia
    const gap = { ...civilTime, month: 3, day: 10, hour: 2, minute: 30 }
    assert.throws(() => api.resolveCivilTimeOffset(gap, 'America/New_York'), /does not exist/)
    const overlap = { ...civilTime, month: 11, day: 3, hour: 1, minute: 30 }
    assert.throws(() => api.resolveCivilTimeOffset(overlap, 'America/New_York'), /ambiguous/)
    const earlier = api.resolveCivilTimeOffset(overlap, 'America/New_York', 'earlier')
    const later = api.resolveCivilTimeOffset(overlap, 'America/New_York', 'later')
    assert.equal(earlier.utcOffsetHours, -4)
    assert.equal(later.utcOffsetHours, -5)
    assert.equal(earlier.ambiguous, true)
    assert.equal(later.utcEpochMilliseconds - earlier.utcEpochMilliseconds, 3600000)
    const halfHour = { ...civilTime, month: 4, day: 7, hour: 1, minute: 45 }
    assert.equal(api.resolveCivilTimeOffset(halfHour, 'Australia/Lord_Howe', 'earlier').utcOffsetHours, 11)
    assert.equal(api.resolveCivilTimeOffset(halfHour, 'Australia/Lord_Howe', 'later').utcOffsetHours, 10.5)
    assert.throws(() => api.resolveCivilTimeOffset({ ...civilTime, yearCe: 2011, month: 12, day: 30 }, 'Pacific/Apia'), /does not exist/)
    assert.equal(api.resolveCivilTimeOffset(civilTime, 'Asia/Kathmandu').utcOffsetHours, 5.75)
    assert.equal(api.resolveCivilTimeOffset(civilTime, 'Asia/Kolkata').utcOffsetHours, 5.5)
    assert.equal(api.resolveCivilTimeOffset(civilTime, 'UTC').utcOffsetHours, 0)
    assert.throws(() => api.resolveCivilTimeOffset(civilTime, 'not-a-zone'), /Unsupported/)
    assert.throws(() => api.resolveCivilTimeOffset({ ...civilTime, day: 31 }, 'UTC'), RangeError)
    assert.throws(() => api.resolveCivilTimeOffset({ ...civilTime, yearCe: 2101 }, 'UTC'), RangeError)
    assert.throws(() => api.resolveCivilTimeOffset(civilTime, 'UTC', 'guess'), RangeError)
  }],
  ['Timezone selection preserves historical seconds and is independent of the host timezone', () => {
    // https://data.iana.org/time-zones/tzdb-2025b/asia : Asia/Bangkok +06:42:04 until 1920-04-01.
    const old = api.resolveCivilTimeOffset({ ...civilTime, yearCe: 1900 }, 'Asia/Bangkok')
    assert.equal(old.utcOffsetHours, 6 + 42 / 60 + 4 / 3600)
    assert.throws(() => api.resolveCivilTimeOffset({ yearCe: 1920, month: 4, day: 1, hour: 0, minute: 5 }, 'Asia/Bangkok'), /does not exist/)
    const script = `const a=require('thai-astrology');process.stdout.write(JSON.stringify(a.resolveCivilTimeOffset(${JSON.stringify(civilTime)},'America/New_York')))`
    const outputs = ['UTC', 'Asia/Bangkok', 'America/New_York', 'Pacific/Apia'].map(TZ => cp.execFileSync(process.execPath, ['-e', script], { env: { ...process.env, TZ }, encoding: 'utf8' }))
    for (const result of outputs.slice(1)) assert.equal(result, outputs[0])
  }],
]
