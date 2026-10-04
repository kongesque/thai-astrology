'use strict'

const assert = require('node:assert/strict')
const api = require('thai-astrology')

const input = { yearBc: 2024, monthTh: 9, day: 15, hour: 8, minute: 30, province: 'เชียงใหม่' }

// Public synthetic contract cases, independent of any external chart records.
const civilTimeCases = [1900, 1920, 2000, 2024, 2076].flatMap(yearBc =>
  [[1, 1], [2, 28], [3, 1], [4, 15], [4, 16], [4, 17], [6, 30], [7, 1], [12, 30], [12, 31]].flatMap(([monthTh, day]) =>
    Array.from({ length: 24 }, (_, hour) => ({ ...input, yearBc, monthTh, day, hour, minute: [0, 1, 59][hour % 3] }))))

module.exports = [
  ['Solar intraday units and lunar apogee agree with exact integer division across their complete domains', () => {
    const { dirname, join } = require('node:path')
    const { solarIntradayUnits, meanLunarApogeeArcMinutes } = require(join(dirname(require.resolve('thai-astrology')), 'engine/astro/math.js'))
    // Independent rational evaluation of the inherited formula; not observed ephemerides.
    // See https://thesiamsociety.org/wp-content/uploads/2000/03/JSS_088_0r_Eade_RulesForInterpolationInThaiCalendar.pdf for units, source evidence and rounding boundaries.
    for (let minuteOfDay = 0; minuteOfDay < 1440; minuteOfDay++) {
      assert.equal(solarIntradayUnits(minuteOfDay), Number(BigInt(minuteOfDay) * 800n / 1440n))
      const chart = api.calculateDetailedPositions({ yearBc: 2024, monthTh: 1, day: 3, hour: Math.floor(minuteOfDay / 60), minute: minuteOfDay % 60, province: 'ไม่ใช้จังหวัด' })
      const solarNumerator = BigInt(chart.calendar.horakhun - 1) * 800n + BigInt(minuteOfDay) * 800n / 1440n - 373n
      assert.equal(chart.diagnostics.solarCycleUnits, Number((solarNumerator % 292207n + 292207n) % 292207n))
      for (let dayIndex = 0; dayIndex < 3232; dayIndex++) {
        // Keep the unsimplified fraction, independent of the implementation's *15 factor.
        const numerator = (BigInt(dayIndex) * 1440n + BigInt(minuteOfDay)) * 21600n
        const expected = Number(numerator / (3232n * 1440n)) + 2
        assert.equal(meanLunarApogeeArcMinutes(dayIndex, minuteOfDay), expected)
      }
    }
    assert.equal(solarIntradayUnits(153), 85)
    assert.equal(meanLunarApogeeArcMinutes(1102, 32), 7367)
  }],
  ['Exact solar-time and apogee corrections reach public Moon results', () => {
    // Synthetic inputs selected from a declared 2024 affected-time grid. Expected values
    // were separately derived with Python Fraction; no external chart records are used.
    for (const [monthTh, day, hour, minute, solarCycleUnits, expectedMoon] of [
      [1, 3, 4, 21, 209077, 9443],
      [10, 4, 0, 32, 136742, 10775],
      [12, 1, 9, 4, 183427, 13513],
    ]) {
      const value = { yearBc: 2024, monthTh, day, hour, minute, province: 'ไม่ใช้จังหวัด' }
      const chart = api.calculateDetailedPositions(value)
      assert.equal(chart.diagnostics.solarCycleUnits, solarCycleUnits)
      assert.equal(chart.longitudes.moon.longitudeArcMinutes, expectedMoon)
      assert.equal(api.calculateThaiHoroscope({ date: { year: 2024, era: 'CE', month: monthTh, day }, time: { hour, minute } }).points.moon.longitudeArcMinutes, expectedMoon)
      assert.equal(api.generateThaiAstrologyChart({ ...value, method: 'suriyayatra' }).longitudes.moon.longitudeArcMinutes, expectedMoon)
    }
  }],
  ['Planetary table interpolation agrees with exact integer-weight arithmetic at every whole-minute node', () => {
    // Two-node Lagrange interpolation, evaluated with BigInt weighted endpoints as an oracle.
    // https://dlmf.nist.gov/3.3.E1 ; Number arithmetic uses IEEE 754 binary64:
    // https://tc39.es/ecma262/#sec-ecmascript-language-types-number-type
    const { dirname, join } = require('node:path')
    const { interpolateTableFloor } = require(join(dirname(require.resolve('thai-astrology')), 'engine/astro/math.js'))
    const table = [0, 244, 427, 488]
    for (let arc = 0; arc <= 5400; arc++) {
      const segment = Math.min(Math.floor(arc / 1800), 2)
      const distance = BigInt(arc - segment * 1800)
      const weightedEndpoints = BigInt(table[segment]) * (1800n - distance) + BigInt(table[segment + 1]) * distance
      const expected = Number(weightedEndpoints * 60n / 1800n)
      assert.equal(interpolateTableFloor(arc, 1800, table, 60), expected, `arc ${arc}`)
    }
    assert.equal(interpolateTableFloor(165, 1800, table, 60), 1342)
    assert.equal(interpolateTableFloor(5400, 1800, table, 60), 29280)
  }],
  ['Exact interpolation corrections reach detailed and structured planetary positions', () => {
    // Synthetic civil inputs; expected outputs follow exact rational evaluation of the existing
    // classical formulas, not an external ephemeris or a captured chart. Derivations in
    // https://dlmf.nist.gov/3.3#i distinguish numerical correctness from sky accuracy.
    for (const [monthTh, day, hour, planet, expected] of [
      [1, 14, 1, 'mars', 15197],
      [3, 25, 3, 'venus', 19170],
      [5, 19, 9, 'jupiter', 2076],
    ]) {
      const value = { yearBc: 2024, monthTh, day, hour, minute: 0, province: 'ไม่ใช้จังหวัด' }
      const chart = api.calculateDetailedPositions(value)
      assert.equal(chart.longitudes[planet].longitudeArcMinutes, expected)
      assert.equal(api.calculateThaiHoroscope({ date: { year: 2024, era: 'CE', month: monthTh, day }, time: { hour, minute: 0 } }).points[planet].longitudeArcMinutes, expected)
    }
  }],
  ['Civil date boundaries and the fixed 06:00 weekday use separate clocks', () => {
    // USNO's J2000.0 is JD 2451545.0 at 2000-01-01 noon UT.
    // The API exposes a civil-date JDN, not the instant's fractional UT Julian date.
    // https://aa.usno.navy.mil/faq/sun_approx
    const noon = api.calculateDetailedPositions({ ...input, yearBc: 2000, monthTh: 1, day: 1, hour: 12, minute: 0 })
    assert.equal(noon.calendar.julianDayNumber, 2451545)
    // https://aa.usno.navy.mil/faq/JD_formula gives this civil-date example.
    assert.equal(api.calculateDetailedPositions({ ...input, yearBc: 1970, monthTh: 1, day: 1 }).calendar.julianDayNumber, 2440588)
    for (const [before, after] of [
      [[1999, 12, 31], [2000, 1, 1]],
      [[1900, 2, 28], [1900, 3, 1]],
      [[2000, 2, 28], [2000, 2, 29]],
      [[2000, 2, 29], [2000, 3, 1]],
      [[2100, 2, 28], [2100, 3, 1]],
    ]) {
      const calculate = ([yearBc, monthTh, day], hour, minute) => api.calculateDetailedPositions({ ...input, yearBc, monthTh, day, hour, minute })
      const last = calculate(before, 23, 59).calendar
      const first = calculate(after, 0, 0).calendar
      assert.equal(first.julianDayNumber, last.julianDayNumber + 1)
      assert.equal(first.civilWeekday, last.civilWeekday % 7 + 1)
      assert.equal(first.astrologicalWeekday, last.civilWeekday)
      const early = calculate(after, 5, 59).calendar
      const six = calculate(after, 6, 0).calendar
      assert.equal(early.astrologicalWeekday, last.civilWeekday)
      assert.equal(six.astrologicalWeekday, first.civilWeekday)
      assert.deepEqual(early.thaiLunarDate, first.thaiLunarDate)
      assert.deepEqual(six.thaiLunarDate, first.thaiLunarDate)
    }
  }],
  ['Province corrections do not change planetary clocks or civil calendars across 1200 cases', () => {
    const provinces = api.getThaiAstrologyProvinces()
    const corrections = [-1440, -720, -345.5, -18, 0, 18, 345.5, 720, 1440]
    assert.equal(civilTimeCases.length, 1200)
    for (const [index, value] of civilTimeCases.entries()) {
      const base = api.calculateDetailedPositions({ ...value, province: 'ไม่ใช้จังหวัด' })
      const { yearBc, ...other } = value
      assert.deepEqual(api.calculateDetailedPositions({ ...other, province: 'ไม่ใช้จังหวัด', yearBe: yearBc + 543 }), base)
      const correction = corrections[index % corrections.length]
      const province = provinces[index % provinces.length]
      for (const location of [{ province: province.province }, { province: 'custom', localTimeCorrectionMinutes: correction }]) {
        const chart = api.calculateDetailedPositions({ ...value, ...location })
        assert.deepEqual(chart.calendar, base.calendar)
        assert.deepEqual(chart.diagnostics, base.diagnostics)
        assert.deepEqual(chart.taksa, base.taksa)
        for (const [key, point] of Object.entries(base.longitudes)) {
          if (key !== 'ascendant') assert.equal(chart.longitudes[key].longitudeArcMinutes, point.longitudeArcMinutes)
        }
        const expected = location.localTimeCorrectionMinutes === undefined ? province.localTimeCorrectionMinutes : correction
        assert.equal(chart.ascendant.localTimeCorrectionMinutes, expected)
        assert.equal(chart.ascendant.referenceTimeMinutes, ((360 + expected) % 1440 + 1440) % 1440)
      }
      // A whole-day reference shift is periodic; it must not roll the input date.
      if (Math.abs(correction) === 1440) {
        const shifted = api.calculateDetailedPositions({ ...value, localTimeCorrectionMinutes: correction })
        assert.ok(Math.abs(shifted.longitudes.ascendant.longitudeArcMinutes - base.longitudes.ascendant.longitudeArcMinutes) < 1e-7)
      }
    }
  }],
  ['The same 1200 civil inputs are independent of the host timezone', () => {
    const { execFileSync } = require('node:child_process')
    const { createHash } = require('node:crypto')
    const expected = createHash('sha256')
    for (const value of civilTimeCases) expected.update(JSON.stringify(api.calculateDetailedPositions(value)) + '\n')
    const digest = expected.digest('hex')
    const script = `
      const api = require(process.argv[1])
      const values = JSON.parse(require('node:fs').readFileSync(0, 'utf8'))
      const hash = require('node:crypto').createHash('sha256')
      for (const value of values) hash.update(JSON.stringify(api.calculateDetailedPositions(value)) + '\\n')
      process.stdout.write(hash.digest('hex'))
    `
    for (const TZ of ['UTC', 'Asia/Bangkok', 'America/New_York', 'Pacific/Apia']) {
      const actual = execFileSync(process.execPath, ['-e', script, require.resolve('thai-astrology')], {
        input: JSON.stringify(civilTimeCases), encoding: 'utf8', env: { ...process.env, TZ },
      })
      assert.equal(actual, digest, `Civil calculation changed under TZ=${TZ}`)
    }
  }],
  ['The 1999 lunar cycle includes an extra eighth month rather than an extra day', () => {
    // The open-source example identifies Julian day 2451545 (2000-01-01)
    // as CS 1361 with an extra month. Only its year classification is asserted.
    // https://github.com/hmmbug/pythaidate/blob/f526c4d9d9ee2a854bf790aaf6d6ee6db90f3f25/README.md
    const january = api.calculateDetailedPositions({ ...input, yearBc: 2000, monthTh: 1, day: 1, hour: 12, minute: 0 }).calendar.thaiLunarDate
    assert.equal(january.yearType, 'intercalary-month')
  }],
  ['The extra-month cycle belongs to 2069 and is not repeated in 2070', () => {
    // CsDate(1431, 5, 1): leap_month = True, leap_day = False, days_in_year = 384.
    // CsDate(1432, 5, 1): no intercalations, days_in_year = 354; tithi 25 then 6.
    // https://github.com/hmmbug/pythaidate/blob/f526c4d9d9ee2a854bf790aaf6d6ee6db90f3f25/pythaidate/lsyear.py
    for (const [yearBc, yearType] of [[2069, 'intercalary-month'], [2070, 'ordinary']]) {
      const autumn = api.calculateDetailedPositions({ ...input, yearBc, monthTh: 10, day: 1, hour: 12, minute: 0 }).calendar.thaiLunarDate
      assert.equal(autumn.yearType, yearType)
    }
  }],
  ['The 2070 new-year offset counts from month five without an extra month', () => {
    // Pinned source: CsDate.fromyd(1432, 2) gives JD 2477220 (2070-04-18), month 5, day 8.
    // https://github.com/hmmbug/pythaidate/blob/f526c4d9d9ee2a854bf790aaf6d6ee6db90f3f25/pythaidate/csdate.py
    const lunar = api.calculateDetailedPositions({ ...input, yearBc: 2070, monthTh: 4, day: 18, hour: 12, minute: 0 }).calendar.thaiLunarDate
    assert.deepEqual([lunar.phase, lunar.day, lunar.month, lunar.secondEighthMonth], ['waxing', 8, 5, false])
  }],
  ['The 2072 extra-month placement includes the following year\'s month-five offset', () => {
    // Pinned source: CS 1434 has 384 days; CS 1435 has 354 days and offset 9.
    // CsDate.fromyd(1435, 2) gives JD 2478316 (2073-04-18), month 5, day 11.
    // https://github.com/hmmbug/pythaidate/blob/f526c4d9d9ee2a854bf790aaf6d6ee6db90f3f25/pythaidate/csdate.py
    for (const [yearBc, yearType] of [[2072, 'intercalary-month'], [2073, 'ordinary']]) {
      const autumn = api.calculateDetailedPositions({ ...input, yearBc, monthTh: 10, day: 1, hour: 12, minute: 0 }).calendar.thaiLunarDate
      assert.equal(autumn.yearType, yearType)
    }
    const spring = api.calculateDetailedPositions({ ...input, yearBc: 2073, monthTh: 4, day: 18, hour: 12, minute: 0 }).calendar.thaiLunarDate
    assert.deepEqual([spring.phase, spring.day, spring.month, spring.secondEighthMonth], ['waxing', 11, 5, false])
  }],
  ['The 2035 extra day completes month seven before month eight begins', () => {
    // Pinned source: CsDate(1397, 7, 30) gives JD 2464514 (2035-07-05).
    // The following day is month 8, day 1; this cycle has 355 days.
    // https://github.com/hmmbug/pythaidate/blob/f526c4d9d9ee2a854bf790aaf6d6ee6db90f3f25/pythaidate/csdate.py
    for (const [day, phase, lunarDay, month] of [[5, 'waning', 15, 7], [6, 'waxing', 1, 8]]) {
      const lunar = api.calculateDetailedPositions({ ...input, yearBc: 2035, monthTh: 7, day, hour: 12, minute: 0 }).calendar.thaiLunarDate
      assert.equal(lunar.yearType, 'intercalary-day')
      assert.deepEqual([lunar.phase, lunar.day, lunar.month, lunar.secondEighthMonth], [phase, lunarDay, month, false])
    }
  }],
  ['The 2036 month-five new-year offset does not add an extra lunar day', () => {
    // Pinned source: CsDate.fromyd(1398, 2) gives JD 2464802 (2036-04-18), month 5, day 22.
    // https://github.com/hmmbug/pythaidate/blob/f526c4d9d9ee2a854bf790aaf6d6ee6db90f3f25/pythaidate/csdate.py
    const lunar = api.calculateDetailedPositions({ ...input, yearBc: 2036, monthTh: 4, day: 18, hour: 12, minute: 0 }).calendar.thaiLunarDate
    assert.equal(lunar.yearType, 'ordinary')
    assert.deepEqual([lunar.phase, lunar.day, lunar.month, lunar.secondEighthMonth], ['waning', 7, 5, false])
  }],
  ['The 2046 extra-day placement includes the following ordinary cycle offset', () => {
    // Pinned source: CS 1408 has 355 days; CS 1409 has 354 days and offset 22.
    // CsDate(1408, 7, 30): JD 2468530 (2046-07-03); next day is month 8, day 1.
    // CsDate.fromyd(1409, 2): JD 2468820 (2047-04-19), month 5, day 24.
    // https://github.com/hmmbug/pythaidate/blob/f526c4d9d9ee2a854bf790aaf6d6ee6db90f3f25/pythaidate/csdate.py
    for (const [day, phase, lunarDay, month] of [[3, 'waning', 15, 7], [4, 'waxing', 1, 8]]) {
      const lunar = api.calculateDetailedPositions({ ...input, yearBc: 2046, monthTh: 7, day, hour: 12, minute: 0 }).calendar.thaiLunarDate
      assert.equal(lunar.yearType, 'intercalary-day')
      assert.deepEqual([lunar.phase, lunar.day, lunar.month, lunar.secondEighthMonth], [phase, lunarDay, month, false])
    }
    const spring = api.calculateDetailedPositions({ ...input, yearBc: 2047, monthTh: 4, day: 19, hour: 12, minute: 0 }).calendar.thaiLunarDate
    assert.equal(spring.yearType, 'ordinary')
    assert.deepEqual([spring.phase, spring.day, spring.month, spring.secondEighthMonth], ['waning', 9, 5, false])
  }],
  ['The 2055 extra day and following cycle offsets form one consistent placement', () => {
    // Pinned source: CS 1417–1420 finalized types B/C/A/A, offsets 21/31/12/23.
    // Julian days 2471808, 2472107, 2472472, 2472837 and 2472193 establish these cases.
    // https://github.com/hmmbug/pythaidate/blob/f526c4d9d9ee2a854bf790aaf6d6ee6db90f3f25/pythaidate/csdate.py
    for (const [yearBc, monthTh, day, phase, lunarDay, month, yearType, secondEighthMonth = false] of [
      [2055, 6, 24, 'waning', 15, 7, 'intercalary-day'],
      [2056, 4, 18, 'waxing', 4, 6, 'intercalary-month'],
      [2057, 4, 18, 'waxing', 14, 5, 'ordinary'],
      [2058, 4, 18, 'waning', 10, 5, 'ordinary'],
      [2056, 7, 13, 'waxing', 1, 8, 'intercalary-month', true],
    ]) {
      const lunar = api.calculateDetailedPositions({ ...input, yearBc, monthTh, day, hour: 12, minute: 0 }).calendar.thaiLunarDate
      assert.equal(lunar.yearType, yearType)
      assert.deepEqual([lunar.phase, lunar.day, lunar.month, lunar.secondEighthMonth], [phase, lunarDay, month, secondEighthMonth])
    }
  }],
  ['The complete 2071 extra-day correction preserves its civil new-year date', () => {
    // Pinned source: CS 1433 has 355 days and offset 18; its year-zero date is
    // JD 2477584 (2071-04-17), month 5, day 18. Month 7, day 30 is JD 2477655.
    // https://github.com/hmmbug/pythaidate/blob/f526c4d9d9ee2a854bf790aaf6d6ee6db90f3f25/pythaidate/csdate.py
    for (const hour of [0, 12, 23]) {
      const lunar = api.calculateDetailedPositions({ ...input, yearBc: 2071, monthTh: 4, day: 17, hour, minute: hour === 23 ? 59 : 0 }).calendar.thaiLunarDate
      assert.deepEqual([lunar.phase, lunar.day, lunar.month, lunar.secondEighthMonth], ['waning', 3, 5, false])
    }
    for (const [day, phase, lunarDay, month] of [[27, 'waning', 15, 7], [28, 'waxing', 1, 8]]) {
      const lunar = api.calculateDetailedPositions({ ...input, yearBc: 2071, monthTh: 6, day, hour: 12, minute: 0 }).calendar.thaiLunarDate
      assert.equal(lunar.yearType, 'intercalary-day')
      assert.deepEqual([lunar.phase, lunar.day, lunar.month, lunar.secondEighthMonth], [phase, lunarDay, month, false])
    }
  }],
  ['The complete 2037 to 2041 placement preserves the civil new-year boundary', () => {
    // Pinned source: CS 1399–1403 cycles C/A/B/C/A, offsets 31/12/23/34/15.
    // Year-zero CS 1399: JD 2465165 (2037-04-16), month 6, day 2.
    // Spring examples: JD 2465167, 2465532, 2465897, 2466263, 2466628.
    // https://github.com/hmmbug/pythaidate/blob/f526c4d9d9ee2a854bf790aaf6d6ee6db90f3f25/pythaidate/csdate.py
    for (const hour of [0, 12, 23]) {
      const lunar = api.calculateDetailedPositions({ ...input, yearBc: 2037, monthTh: 4, day: 16, hour, minute: hour === 23 ? 59 : 0 }).calendar.thaiLunarDate
      assert.deepEqual([lunar.phase, lunar.day, lunar.month, lunar.secondEighthMonth], ['waxing', 2, 6, false])
    }
    for (const [yearBc, phase, lunarDay, month, yearType] of [
      [2037, 'waxing', 4, 6, 'intercalary-month'],
      [2038, 'waxing', 14, 5, 'ordinary'],
      [2039, 'waning', 10, 5, 'intercalary-day'],
      [2040, 'waxing', 7, 6, 'intercalary-month'],
      [2041, 'waning', 2, 5, 'ordinary'],
    ]) {
      const lunar = api.calculateDetailedPositions({ ...input, yearBc, monthTh: 4, day: 18, hour: 12, minute: 0 }).calendar.thaiLunarDate
      assert.equal(lunar.yearType, yearType)
      assert.deepEqual([lunar.phase, lunar.day, lunar.month, lunar.secondEighthMonth], [phase, lunarDay, month, false])
    }
  }],
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
