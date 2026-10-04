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

Supply a birth date, local time and birthplace to obtain planetary positions, houses, rulers, lunar mansions and dignities. Results include Thai or Arabic chart symbols for drawing charts, displaying position tables and building interpretation rules.

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

Calculate the chart shown in the hero image: **21 April 1782 (BE 2325), 06:54, Bangkok**.

```ts
import { calculateThaiHoroscope } from "thai-astrology"

const horoscope = calculateThaiHoroscope({
  date: { year: 1782, era: "CE", month: 4, day: 21 },
  time: { hour: 6, minute: 54 },
  location: { province: "กรุงเทพมหานคร" },
})

console.log(horoscope.points.ascendant.signName) // เมษ (Aries)
console.log(horoscope.points.sun.signName) // เมษ (Aries)
console.log(horoscope.calendar.thaiLunarDate?.label) // ข๑๐ด ๖ = waxing day 10, lunar month 6
```

Edit `date`, `time` and `location.province` for another chart. Use `era: "CE"` for Common Era, or `year: 2325, era: "BE"` for the equivalent Buddhist Era date. Enter local time as numbers: hour 0–23 and minute 0–59. Names and gender are not required.

This historical example uses the **06:00 ascendant reference with province correction** and the civil-local planetary clock, matching the hero image. The coordinate-sunrise and timezone helpers support CE 1900–2100, so they cannot be used for this 1782 chart. For dates within that range, the [API guide](docs/api-en.md#input-and-main-apis) provides a complete example with daily sunrise rounded to the nearest minute, date-aware UTC and the +06:42:04 planetary frame.

For CommonJS, replace the import with `const { calculateThaiHoroscope } = require("thai-astrology")`.

## Display a Rasi chart

The code above produces the same Rasi chart as the hero image. Read its twelve channels from `horoscope`:

```ts
console.log(horoscope.charts.rasi.channels.thai)
// ["ลั๑*", "๓๙", "๐", "๒", "", "", "", "", "๕๗", "", "", "๔๖๘"]
```

The result contains 12 strings ordered Aries through Pisces. An empty string means no planets; `ลั` marks the ascendant and `*` marks Tanuseth. Use `channels.arabic` for Arabic numerals, or replace `rasi` with `navamsa` / `drekkana` for those divisional charts.

The library returns chart data so you can choose your own layout. See the [illustration script](scripts/render-readme-chart.cjs) for an SVG example.

To display a planet's position, use its sign name and degrees/minutes within that sign. For angular calculations, use total `longitudeDegrees`. Sign indices run 0–11; houses run 1–12. The API guide documents units and the full result structure.

For calendar dates, read `calendar.thaiLunarDate`. The separately returned `calendar.lunarDay` is calculated from the Moon–Sun angle and can differ from the calendar day. In this example, the calendar date is waxing day 10 of lunar month 6, while the angular lunar day is 8.

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

The README example uses the 06:00 province reference. For coordinate sunrise, supply `ascendantReference`; for a chosen planetary frame, supply `planetaryTimeReference` as well. The birthplace's UTC offset and the selected calculation frame are separate settings. See [calculation settings](docs/api-en.md#sunrise-and-planetary-time-settings).

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
