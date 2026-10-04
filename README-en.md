<h1 align="center">Thai Astrology - JavaScript &amp; TypeScript Library</h1>

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
  <a href="README.md">ภาษาไทย</a> &nbsp;|&nbsp;
  <a href="#quick-start">Quick start</a> &nbsp;|&nbsp;
  <a href="docs/api-en.md">API</a> &nbsp;|&nbsp;
  <a href="https://github.com/kongesque/thai-astrology/issues">Report an issue</a>
</p>

`thai-astrology` calculates Thai natal charts, ascendants, planetary positions and transits using Suriyayatra, with Taksa and Thai lunar dates. Supply a birth date, local time and province, then use the results in your website, app or API.

Supports **Node.js 16+**, JavaScript and TypeScript, ESM and CommonJS, and browsers through a bundler. No runtime dependencies.

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

Read the chart symbols from the `horoscope` above:

```ts
console.log(horoscope.charts.rasi.channels.thai)
// ["", "๕*๐", "๓", "", "๑๔", "ลั๖", "", "", "๙", "๒", "๗", "๘"]
```

The result contains 12 strings ordered Aries through Pisces. An empty string means no planets; `ลั` marks the ascendant and `*` marks Tanuseth. Use `channels.arabic` for Arabic numerals, or replace `rasi` with `navamsa` / `drekkana` for those divisional charts.

<p align="center">
  <img src="assets/rasi-chart.svg" alt="Thai natal horoscope: Suriyayatra Rasi chart with Thai numerals and an Aries ascendant" width="100%" />
  <br /><sub>Illustration: 21 April 1782 (BE 2325), 06:54, Bangkok. This is a different chart from the code example.</sub>
</p>

The library returns chart data so you can choose your own layout. See the [illustration script](scripts/render-readme-chart.cjs) for an SVG example.

## Read other results

| What you need | Field |
| --- | --- |
| Planetary and ascendant positions, including degrees/minutes | `points.sun`, `points.moon`, `points.ascendant` |
| Twelve houses, their rulers and occupants | `houses` |
| Ascendant ruler, Tanuseth and ascendant occupants | `factors` |
| Lunar mansion/Rerk and planetary dignities | Fields within each planet's `points` entry |
| Thai lunar date | `calendar.thaiLunarDate` |
| Eight Taksa categories | `taksa` |

Results are JSON-serializable and repeatable for identical inputs. Your app supplies interpretation rules and prediction text.

## Continue with the API guide

The [English API guide](docs/api-en.md) covers fields, units, options and further examples. Choose the section for your task:

- [Coordinate sunrise and planetary time settings](docs/api-en.md#sunrise-and-planetary-time-settings)
- [Province, country and foreign birthplace selection](docs/api-en.md#province-and-country-selection)
- [City search and UTC offsets, including DST](docs/api-en.md#country-scoped-location-search-and-offsets)
- [Validate form input](docs/api-en.md#validation-and-full-types)
- [Compare transits with a natal chart](docs/api-en.md#transit-comparisons)
- [Earlier input shapes and the full function list](docs/api-en.md#input-and-main-apis)

## Calculation rules and limitations

- Birth time and a birthplace are needed for this example. An assumed time or provincial-seat location can change the ascendant and houses; use precise coordinates when available.
- The sunrise/offset workflow supports CE 1900–2100. The example explicitly supplies its calculation settings; a bare `date`/`time`/`location` call uses different defaults.
- The ascendant uses fixed classical rising durations rather than a modern geometric model. Relationships use zodiac signs; the API guide describes the calculation conventions.
- Thai lunar dates support CE 1582–2076, return `null` outside that range and can differ from published calendars.

`calculateThaiHoroscope()` always uses Suriyayatra. The earlier `generateThaiAstrologyChart()` API defaults to `legacy`; select `method: "suriyayatra"` to use the same method.

## Development and contributions

Use Node.js 24 for development:

```bash
npm ci
npm run check
```

Edit code in `src/` and regenerate the illustration with `npm run docs:chart`. Report issues through [GitHub Issues](https://github.com/kongesque/thai-astrology/issues), including the date, local time, location and calculation method without personal details.

Released under the [MIT License](LICENSE). Location data from [GeoNames](https://www.geonames.org/) uses [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See [SOURCES.md](SOURCES.md) for formula and data references.
