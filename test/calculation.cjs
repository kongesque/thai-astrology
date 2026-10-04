'use strict'

const assert = require('node:assert/strict')
const api = require('thai-astrology')

const input = { yearBc: 2024, monthTh: 9, day: 15, hour: 8, minute: 30, province: 'เชียงใหม่' }

module.exports = [
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
