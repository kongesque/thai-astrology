<h1 align="center">Thai Astrology - Suriyayatra for JavaScript &amp; TypeScript</h1>

<p align="center">
  Calculate Thai natal Rasi charts, ascendants, planetary positions and transits in JavaScript and TypeScript
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/thai-astrology"><img src="https://img.shields.io/npm/v/thai-astrology?color=cb3837" alt="npm version" /></a>
  <a href="https://github.com/kongesque/thai-astrology"><img src="https://img.shields.io/badge/GitHub-thai--astrology-181717?logo=github" alt="GitHub repository" /></a>
  <a href="https://github.com/kongesque/thai-astrology/actions/workflows/ci.yml"><img src="https://github.com/kongesque/thai-astrology/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-2563eb" alt="MIT License" /></a>
</p>

<p align="center">
  <img src="assets/rasi-chart.svg" alt="Suriyayatra Thai natal chart showing twelve zodiac signs, Thai planetary numerals and an Aries ascendant" width="960" />
  <br /><sub>Suriyayatra Rasi chart · 21 April 1782 (BE 2325), 06:54, Bangkok · Ascendant reference 06:18</sub>
</p>

<p align="center">
  <a href="README.md">ภาษาไทย</a> &nbsp;|&nbsp;
  <a href="#quick-start">Quick start</a> &nbsp;|&nbsp;
  <a href="docs/api-en.md">API guide</a> &nbsp;|&nbsp;
  <a href="SOURCES.md">Sources</a> &nbsp;|&nbsp;
  <a href="https://github.com/kongesque/thai-astrology/issues">Report an issue</a>
</p>

**`thai-astrology` is an open-source Thai astrology library for JavaScript and TypeScript, using classical Suriyayatra (สุริยยาตร์) calculations.** Calculate natal Rasi charts (ราศีจักรสุริยยาตร์), the ascendant and positions of the ten Thai astrological planets from a birth date, local time and birthplace. Results include zodiac signs, degrees and arcminutes, with planetary transits compared against the natal chart.

Results cover twelve houses and their rulers, Tanulak, Tanuseth, Taksa, Rerk categories, lunar mansions and their quarters, and planetary dignities, along with Navamsa and Drekkana charts. The Thai lunar calendar reports waxing or waning days and lunar months. Use the API's structured results, Thai names and Thai or Arabic chart symbols to draw charts, display position tables or build interpretation rules.

Start with a Buddhist Era or Common Era date, birth time and province. For recognized Thai provinces in CE 1900–2100, the API selects coordinates, resolves the birth date's UTC offset and calculates daily sunrise automatically. For a precise birthplace or a birth abroad, supply latitude, longitude and the date's UTC offset, including daylight saving time (DST).

Install through **npm** and use with **Node.js 16+**, ESM, CommonJS or browsers through a bundler. There are no runtime dependencies, and chart results are JSON-serializable.

## What the library calculates

| Astrological result | What you receive | API field |
| --- | --- | --- |
| Rasi chart — ราศีจักร | Signs of the ten planets and ascendant, with Thai or Arabic chart symbols | `charts.rasi` |
| Planetary positions — สมผุส | Sign, degrees/minutes, total longitude and house for each point | `points` |
| Navamsa and Drekkana | Divisional charts using nine and three subdivisions of each sign | `charts.navamsa`, `charts.drekkana` |
| Houses and rulers — ภพและเจ้าเรือน | Twelve whole-sign houses, their rulers and occupants | `houses` |
| Tanulak and Tanuseth — ตนุลัคน์/ตนุเศษ | Ascendant sign ruler, calculated Tanuseth and ascendant occupants | `factors` |
| Rerk and dignities — ฤกษ์/มาตรฐานดาว | Position within the 27 lunar mansions, its quarter, one of nine Rerk categories and supported dignity labels | Fields within `points` |
| Taksa — ทักษา | Eight categories, including Boriwan, Ayu and Kalakini | `taksa` |
| Thai lunar date — วันจันทรคติ | Waxing/waning day, lunar month and intercalation type | `calendar.thaiLunarDate` |
| Planetary transits — ดาวจร | Transit positions, natal houses and longitude differences | `calculateHoroscopeTransits()` |

**Tanulak** is the ruler of the ascendant's sign. **Tanuseth** is a planet selected by its own calculation; `*` marks it in the chart. Ascendant occupants are the planets sharing the ascendant sign. The API returns these separately so your interpretation rules can use the intended result.

## Quick start

Install the package:

```bash
npm install thai-astrology
```

### Before calculating a chart

- **Date and time:** enter the birthplace's local clock time without converting it to UTC first. Match `era: "BE"` or `"CE"` to the supplied year. Input dates use the Gregorian calendar.
- **Birth time:** use a birth certificate or another reliable record. Mark an estimated time as an assumption, since the ascendant and houses can change with birth time.
- **Birthplace:** selecting a province uses its provincial-seat coordinates. For a known birthplace, supply that point's latitude and longitude through the [coordinate-based sunrise settings](docs/api-en.md#coordinate-based-sunrise).
- **Timezone:** foreign births require the UTC offset at the birth date and time, including DST. [City helpers](docs/api-en.md#country-scoped-location-search-and-offsets) can resolve it for the supplied date through runtime IANA/Intl rules. Edited coordinates require a verified `timeZone` or an explicit UTC offset; coordinates alone do not identify a timezone.
- **Time reference:** the main example uses daily location-based sunrise for recognized Thai provinces in CE 1900–2100. If your source specifies 06:00 or your date falls outside this range, read [when to use the 06:00 reference](docs/api-en.md#0600-reference). When comparing results, use the same date, time, coordinates and time-reference convention.

Calculate an example chart: **15 September 2024 (BE 2567), 08:30, Chiang Mai**.

```ts
import { calculateThaiHoroscope } from "thai-astrology"

const horoscope = calculateThaiHoroscope({
  date: { year: 2024, era: "CE", month: 9, day: 15 },
  time: { hour: 8, minute: 30 },
  location: { province: "เชียงใหม่" },
})

console.log(horoscope.points.ascendant.signName) // กันย์ (Virgo)
console.log(horoscope.points.sun.signName) // สิงห์ (Leo)
console.log(horoscope.calendar.thaiLunarDate?.label) // ข๑๓ด๑๐ = waxing day 13, lunar month 10
```

Edit `date`, `time` and `location.province` for another chart. This example can also use `year: 2567, era: "BE"` for the equivalent Buddhist Era date. Enter time as numbers: hour 0–23 and minute 0–59. Names and gender are not required.

**Automatic settings:** for a recognized Thai province in CE 1900–2100, `calculateThaiHoroscope()` fills provincial-seat coordinates, resolves the date’s UTC offset, uses daily sunrise rounded to the nearest minute and selects the historical Bangkok +06:42:04 planetary frame. Supply only `date`, `time` and `location.province`; users do not need to enter those calculation settings.

For CommonJS, replace the import with `const { calculateThaiHoroscope } = require("thai-astrology")`.

## Display a Rasi chart

Read the example chart's twelve channels from `horoscope`:

```ts
console.log(horoscope.charts.rasi.channels.thai)
// ["", "๕*๐", "๓", "", "๑๔", "ลั๖", "", "", "๙", "๒", "๗", "๘"]
```

The result contains 12 strings ordered Aries through Pisces. An empty string means no planets; `ลั` marks the ascendant and `*` marks Tanuseth. Use `channels.arabic` for Arabic numerals, or replace `rasi` with `navamsa` / `drekkana` for those divisional charts.

The library returns chart data so you can choose your own layout. See the [illustration script](scripts/render-readme-chart.cjs) for an SVG example.

To display a planet's position, use its sign name and degrees/minutes within that sign. For angular calculations, use total `longitudeDegrees`. Sign indices run 0–11; houses run 1–12. The API guide documents units and the full result structure.

For calendar dates, read `calendar.thaiLunarDate`. The separately returned `calendar.lunarDay` is calculated from the Moon–Sun angle and can differ from the calendar day. In this example, the calendar date is waxing day 13 of lunar month 10, while the angular lunar day is 12.

## Continue with the API guide

The [English API guide](docs/api-en.md) covers fields, units, options and further examples. Choose the section for your task:

- [Coordinate sunrise and planetary time settings](docs/api-en.md#sunrise-and-planetary-time-settings)
- [Province, country and foreign birthplace selection](docs/api-en.md#province-and-country-selection)
- [City search and UTC offsets, including DST](docs/api-en.md#country-scoped-location-search-and-offsets)
- [Validate form input](docs/api-en.md#validation-and-full-types)
- [Compare transits with a natal chart](docs/api-en.md#transit-comparisons)
- [Input types and the full function list](docs/api-en.md#function-and-input-reference)

## Calculation rules and limitations

The hero illustration uses 21 April 1782 (BE 2325), 06:54, Bangkok, outside the supported sunrise range. Its rendering script uses the 06:00 base plus an 18-minute longitude correction, giving a 06:18 ascendant reference. See [advanced reference settings](docs/api-en.md#sunrise-and-planetary-time-settings).

Planetary positions follow classical Suriyayatra formulas. The ascendant uses fixed classical rising durations (อันโตนาทีสามัญ), and houses use the whole-sign system. Relationships count zodiac signs. These conventions matter when comparing results with another school or implementing interpretation rules.

The province correction for the 06:00 reference is derived from provincial-seat longitude in the UTC+7 reference frame and rounded to minutes, replacing fixed minute values. Use the [coordinate-based mean solar correction helper](docs/api-en.md#coordinate-based-mean-solar-correction) for other coordinates or offsets; the main usage example uses daily sunrise and date-aware UTC.

Automatic selection applies only when neither reference nor a custom province correction is supplied. Explicit `ascendantReference` or `planetaryTimeReference` settings retain their existing meaning. The birthplace's UTC offset and the calculation frame are separate values. Low-level `calculateDetailedPositions()` and the earlier chart wrapper retain their existing defaults; see [calculation settings](docs/api-en.md#sunrise-and-planetary-time-settings).

| Reference area | Basis used by the library |
| --- | --- |
| Classical calendar and lunar arithmetic | Public Thai calculation descriptions and J. C. Eade's calendar research |
| Sunrise | NOAA/Meeus solar calculations and USNO rise/set definitions |
| Birthplace and civil time | GeoNames coordinates and runtime IANA timezone rules |

[SOURCES.md](SOURCES.md) lists the publications, open-source implementations and open data. These references document formulas and conventions; they do not certify every computed position.

- **Foreign locations:** a country name alone cannot determine coordinates and UTC. Classical rising durations remain fixed for foreign charts.
- **Location coverage:** the catalog contains 1,945 points in 243 countries/territories, including all 77 Thai provincial seats. Every point has latitude, longitude and a timezone name. It does not cover every city or timezone; seven of the 250 country/territory entries have no catalog locations.
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
