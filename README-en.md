<h1 align="center">Thai Astrology — Suriyayatra for JavaScript &amp; TypeScript</h1>

<p align="center">
  Calculate Thai natal charts, ascendants and planetary transits with Suriyayatra
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/thai-astrology"><img src="https://img.shields.io/npm/v/thai-astrology?color=cb3837" alt="npm version" /></a>
  <a href="https://github.com/kongesque/thai-astrology"><img src="https://img.shields.io/badge/GitHub-thai--astrology-181717?logo=github" alt="GitHub repository" /></a>
  <a href="https://github.com/kongesque/thai-astrology/actions/workflows/ci.yml"><img src="https://github.com/kongesque/thai-astrology/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-2563eb" alt="MIT License" /></a>
</p>

<p align="center">
  <img src="assets/rasi-chart.svg" alt="Suriyayatra Thai natal chart showing twelve zodiac signs, Thai planetary numerals and an Aries ascendant" width="960" />
  <br /><sub>Suriyayatra Rasi chart · 21 April 1782 (BE 2325), 06:54, Bangkok · 06:00 ascendant reference</sub>
</p>

<p align="center">
  <a href="README.md">ภาษาไทย</a> &nbsp;|&nbsp;
  <a href="#quick-start">Quick start</a> &nbsp;|&nbsp;
  <a href="docs/api-en.md">API guide</a> &nbsp;|&nbsp;
  <a href="SOURCES.md">Sources</a> &nbsp;|&nbsp;
  <a href="https://github.com/kongesque/thai-astrology/issues">Report an issue</a>
</p>

**`thai-astrology` is an open-source Thai astrology library for JavaScript and TypeScript.** It calculates natal charts, ascendants and planetary positions using **Suriyayatra (สุริยยาตร์)**, together with divisional charts, Taksa, Thai lunar dates and planetary transits.

For Thai astrologers, the results include familiar chart symbols, sign and house names, rulers and dignities. For developers, the same results are structured data for chart displays, interpretation rules and APIs. Your app supplies the reading and prediction text.

Supports **Node.js 16+**, ESM, CommonJS and browsers through a bundler, with no runtime dependencies. Chart results are JSON-serializable; planet, sign, house and Rerk names are returned in Thai.

## What the library calculates

| Astrological result | What you receive | API field |
| --- | --- | --- |
| Rasi chart — ราศีจักร | Signs of the ten planets and ascendant, with Thai or Arabic chart symbols | `charts.rasi` |
| Planetary positions — สมผุส | Sign, degrees/minutes, total longitude and house for each point | `points` |
| Navamsa and Drekkana | Divisional charts using nine and three subdivisions of each sign | `charts.navamsa`, `charts.drekkana` |
| Houses and rulers — ภพและเจ้าเรือน | Twelve whole-sign houses, their rulers and occupants | `houses` |
| Tanulak and Tanuseth — ตนุลัคน์/ตนุเศษ | Ascendant sign ruler, calculated Tanuseth and ascendant occupants | `factors` |
| Rerk and dignities — ฤกษ์/มาตรฐานดาว | Lunar mansion, quarter and supported dignity labels | Fields within `points` |
| Taksa — ทักษา | Eight categories, including Boriwan, Ayu and Kalakini | `taksa` |
| Thai lunar date — วันจันทรคติ | Waxing/waning day, lunar month and intercalation type | `calendar.thaiLunarDate` |
| Planetary transits — ดาวจร | Transit positions, natal houses and longitude differences | `calculateHoroscopeTransits()` |

**Tanulak** is the ruler of the ascendant's sign. **Tanuseth** is a planet selected by its own calculation; `*` marks it in the chart. Ascendant occupants are the planets sharing the ascendant sign. The API returns these separately so your interpretation rules can use the intended result.

## Quick start

Install the package:

```bash
npm install thai-astrology
```

Calculate a chart from a birth date, time and province:

```ts
import {
  calculateThaiHoroscope,
  createSunriseReference,
  resolveCivilTimeOffset,
} from "thai-astrology"

// Edit the birth details here; yearCe is Common Era.
const birth = { yearCe: 2024, month: 9, day: 15, hour: 8, minute: 30 }
const province = "เชียงใหม่"

const { utcOffsetHours } = resolveCivilTimeOffset(birth, "Asia/Bangkok")
const horoscope = calculateThaiHoroscope({
  date: { year: birth.yearCe, era: "CE", month: birth.month, day: birth.day },
  time: { hour: birth.hour, minute: birth.minute },
  ascendantReference: createSunriseReference({
    province, utcOffsetHours, timePrecision: "minute",
  }),
  planetaryTimeReference: {
    civilUtcOffsetSeconds: Math.round(utcOffsetHours * 3600),
    referenceUtcOffsetSeconds: 6 * 3600 + 42 * 60 + 4,
  },
})

console.log(horoscope.points.ascendant.signName) // กันย์ (Virgo)
console.log(horoscope.points.sun.signName) // สิงห์ (Leo)
console.log(horoscope.calendar.thaiLunarDate?.label) // ข๑๓ด๑๐ = waxing day 13, lunar month 10
```

Enter the birth details in `birth` and select a Thai province in `province`. `yearCe` is Common Era; subtract 543 from a Buddhist Era year. Hours are 0–23 and minutes 0–59, in local civil time. Names and gender are not required. Returned planet, sign and house names are in Thai.

The remaining code is your app's calculation setup: resolve the date's UTC offset, use the province's coordinates for daily sunrise rounded to the nearest minute, and calculate planets in the historical Bangkok +06:42:04 frame. Keep that frame fixed when changing birthplace; it is separate from the birthplace's UTC offset. Users only enter birth details.

For CommonJS, replace the import with `const { calculateThaiHoroscope, createSunriseReference, resolveCivilTimeOffset } = require("thai-astrology")`.

Continue with [foreign locations, precise coordinates and form input](docs/api-en.md). To retain the 06:00 province-reference calculation, see [traditional settings](docs/api-en.md#traditional-calculations).

## Display a Rasi chart

The hero image is a historical chart using the 06:00 reference. The code above calculates a different chart for 2024 using coordinate sunrise. Read its symbols from `horoscope`:

```ts
console.log(horoscope.charts.rasi.channels.thai)
// ["", "๕*๐", "๓", "", "๑๔", "ลั๖", "", "", "๙", "๒", "๗", "๘"]
```

The result contains 12 strings ordered Aries through Pisces. An empty string means no planets; `ลั` marks the ascendant and `*` marks Tanuseth. Use `channels.arabic` for Arabic numerals, or replace `rasi` with `navamsa` / `drekkana` for those divisional charts.

The library returns chart data so you can choose your own layout. See the [illustration script](scripts/render-readme-chart.cjs) for an SVG example.

To display a planet's position, use its sign name and degrees/minutes within that sign. For angular calculations, use total `longitudeDegrees`. Sign indices run 0–11; houses run 1–12. The API guide documents units and the full result structure.

For calendar dates, read `calendar.thaiLunarDate`. The separately returned `calendar.lunarDay` is calculated from the Moon–Sun angle and can differ from the calendar day. In this example, the calendar day is waxing 13, while the angular lunar day is 12.

## Continue with the API guide

The [English API guide](docs/api-en.md) covers fields, units, options and further examples. Choose the section for your task:

- [Coordinate sunrise and planetary time settings](docs/api-en.md#sunrise-and-planetary-time-settings)
- [Province, country and foreign birthplace selection](docs/api-en.md#province-and-country-selection)
- [City search and UTC offsets, including DST](docs/api-en.md#country-scoped-location-search-and-offsets)
- [Validate form input](docs/api-en.md#validation-and-full-types)
- [Compare transits with a natal chart](docs/api-en.md#transit-comparisons)
- [Input types and the full function list](docs/api-en.md#function-and-input-reference)

## Calculation rules and limitations

Planetary positions follow classical Suriyayatra formulas. The ascendant uses fixed classical rising durations (อันโตนาทีสามัญ), and houses use the whole-sign system. Relationships count zodiac signs. These conventions matter when comparing results with another school or implementing interpretation rules.

The quick start explicitly selects coordinate sunrise rounded to the nearest minute and the historical Bangkok +06:42:04 planetary time frame. The frame is a calculation convention; the birthplace's civil UTC offset is resolved separately. A bare `date`/`time`/`location` call retains the 06:00 province reference and civil-local planetary clock. See [calculation settings](docs/api-en.md#sunrise-and-planetary-time-settings).

| Reference area | Basis used by the library |
| --- | --- |
| Classical calendar and lunar arithmetic | Public Thai calculation descriptions and J. C. Eade's calendar research |
| Sunrise | NOAA/Meeus solar calculations and USNO rise/set definitions |
| Birthplace and civil time | GeoNames coordinates and runtime IANA timezone rules |

[SOURCES.md](SOURCES.md) lists the publications, open-source implementations, open data and licensing, with each reference's scope. These references document formulas and conventions; they do not certify every computed position.

- **Birth details:** time is required. A guessed time or provincial-seat location can change the ascendant and houses; use the actual coordinates when known.
- **Foreign locations:** choose a catalog city or provide latitude, longitude and the birth date's UTC offset, including DST. A country name alone cannot determine these. Classical rising durations remain fixed for foreign charts.
- **Date range:** coordinate sunrise and civil-offset helpers support CE 1900–2100. Thai lunar dates support CE 1582–2076 and return `null` outside that range; they can differ from published calendars.
- **Sunrise model:** uses a sea-level horizon without terrain, elevation or weather corrections. Dates with no sunrise require handling; the selected sunrise horoscope throws `RangeError`.

`calculateThaiHoroscope()` always uses Suriyayatra. The earlier `generateThaiAstrologyChart()` API defaults to `legacy`; select `method: "suriyayatra"` explicitly for Suriyayatra.

## Development and contributions

The [public test suite](test/run.cjs) covers calendar rules, zodiac boundaries, timezones and published-release regression cases. Package checks also verify installed CommonJS, ESM, TypeScript and browser consumers. See the [CI workflow](.github/workflows/ci.yml).

Use Node.js 24 for development:

```bash
npm ci
npm run check
```

Edit code in `src/` and regenerate the illustration with `npm run docs:chart`. Report issues through [GitHub Issues](https://github.com/kongesque/thai-astrology/issues), including the date, local time, location and calculation method without personal details.

Released under the [MIT License](LICENSE). Location data from [GeoNames](https://www.geonames.org/) uses [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See [SOURCES.md](SOURCES.md) for formula and data references.
