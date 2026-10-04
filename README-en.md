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
  <a href="#calculate-a-thai-natal-chart-and-ascendant">Quick start</a> &nbsp;|&nbsp;
  <a href="#thai-astrology-api-reference">API</a> &nbsp;|&nbsp;
  <a href="https://github.com/kongesque/thai-astrology/issues">Report an issue</a>
</p>

`thai-astrology` is an **open source Thai astrology calculation library for JavaScript and TypeScript**. It uses classical Suriyayatra (สุริยยาตร์) to calculate natal birth charts, ascendants, planetary positions, transits, Taksa and Thai lunar calendar dates. Supply the birth date, local civil time, coordinates and calculation clock to get structured horoscope data through its API.

Build Thai horoscope websites, astrology apps or APIs with deterministic, JSON-serializable results and your own interpretation rules. Other uses include ascendant calculators, natal and transit comparison tools, Thai lunar calendars, and educational tools for exploring Suriyayatra calculations.

Supports **Node.js 16+**, ESM and CommonJS, includes TypeScript types, works in browsers through a bundler, and has no runtime dependencies.

<p align="center">
  <img src="assets/rasi-chart.svg" alt="Thai natal horoscope: Suriyayatra Rasi chart with Thai numerals and an Aries ascendant" width="100%" />
</p>

<p align="center">
  <sub><a href="https://github.com/kongesque/thai-astrology/blob/main/scripts/render-readme-chart.cjs">Example Suriyayatra Rasi chart</a> · 21 April 1782 (BE 2325), 06:54, Bangkok</sub><br />
  <sub>Thai numerals identify planets; <code>ลั</code> marks the ascendant and <code>*</code> marks Tanuseth.</sub>
</p>

## What it calculates

- **Natal horoscopes:** 10 planetary positions, ascendants, houses, rulers, Tanuseth, lunar mansions, nine Rerk categories and dignities.
- **Chart data:** Rasi, navamsa and drekkana positions with Thai or Arabic numeral channels.
- **Transits and calendars:** Natal comparisons, Taksa, geometric lunar phase and Thai lunar dates.

## Calculate a Thai natal chart and ascendant

```bash
npm install thai-astrology
```

For natal charts, use the birth date and local civil time, resolve the dated UTC offset, and supply both the planetary clock (`planetaryTimeReference`) and coordinate sunrise (`ascendantReference`). An app can fill coordinates from a province/city and resolve the offset; users do not need to enter the planetary reference offset themselves.

The example declares the IANA-derived Bangkok +06:42:04 planetary frame in application code; it is not prescribed for every school. Both fields must be supplied explicitly: the API does not enable them when omitted. See [traditional calculations](#traditional-calculations) for existing calls.

```ts
import { calculateThaiHoroscope, createSunriseReference, resolveCivilTimeOffset } from "thai-astrology"

const civilTime = { yearCe: 2024, month: 9, day: 15, hour: 8, minute: 30 }
const { utcOffsetHours } = resolveCivilTimeOffset(civilTime, "Asia/Bangkok")
const ascendantReference = createSunriseReference({ province: "เชียงใหม่", utcOffsetHours, timePrecision: "minute" })
const planetaryTimeReference = {
  civilUtcOffsetSeconds: Math.round(utcOffsetHours * 3600),
  referenceUtcOffsetSeconds: 6 * 3600 + 42 * 60 + 4,
}

const horoscope = calculateThaiHoroscope({
  date: { year: civilTime.yearCe, era: "CE", month: civilTime.month, day: civilTime.day },
  time: { hour: civilTime.hour, minute: civilTime.minute },
  ascendantReference,
  planetaryTimeReference,
})

console.log(horoscope.points.sun.degrees, horoscope.points.sun.minutes) // 27 56
console.log(horoscope.points.ascendant.signName) // กันย์
console.log(horoscope.timing.sunrise?.roundedTimeMinutes) // 372 = 06:12
```

For CommonJS, replace the `import` line with `const { calculateThaiHoroscope, createSunriseReference, resolveCivilTimeOffset } = require("thai-astrology")`.

The illustration above uses a 1782 CE chart with traditional settings.

### Birth date, local time and province

| Field | What to provide |
| --- | --- |
| `date` | A civil Gregorian date; use `era: "BE"` for Buddhist Era or `"CE"` for Common Era. BE 2567 = CE 2024 |
| `time` | Local civil time: hours 0-23, minutes 0-59. Birth time is required |
| `location` (optional) | A Thai `province` name; `getThaiAstrologyProvinces()` lists all 77 provinces |
| `planetaryTimeReference` | Supply civil/reference UTC offsets in integer seconds for the main workflow; omit for traditional calculations |
| `ascendantReference` | Supply `method: "sunrise"`, coordinates, `utcOffsetHours` including DST and `timePrecision: "minute"` for minute-table time; omit precision for the existing continuous calculation |

Supply valid dates and times as numbers. In traditional calculations, omitting the location applies zero correction. Set `location.localTimeCorrectionMinutes` to override the province correction in minutes. Names and gender are not required for calculation.

### Unknown birthplace or birth time

- **Unknown birthplace:** use the traditional reference by omitting `ascendantReference` and `location`. The 06:00 reference uses zero correction, which can affect the ascendant and houses. If the civil UTC offset is known, the planetary clock can still be specified separately.
- **Unknown birth time:** `time` is always required. There is no default time or date-only mode.
- **When using an assumed time:** state the assumption clearly and omit ascendant-dependent results. Planetary positions are estimates, and Taksa can differ before or after 06:00.

Lower-level Suriyayatra APIs use `province: "ไม่ระบุจังหวัด"` for zero correction (the previous name `"ไม่ใช้จังหวัด"` remains supported). Legacy uses 18 minutes for an unrecognized province without an explicit correction, preserving existing behavior rather than estimating the birthplace.

### Sunrise at explicit coordinates

Use `timePrecision: "minute"` to round sunrise to the nearest minute before calculating the ascendant. Raw sunrise remains available at `timing.sunrise.timeMinutes`. Omitted precision or `"continuous"` preserves existing results. Rounding selects the reference-time precision; it does not improve the physical accuracy of sunrise predictions.

```ts
const seasonal = calculateThaiHoroscope({
  date: { year: 2024, era: "CE", month: 6, day: 21 },
  time: { hour: 8, minute: 30 },
  ascendantReference: {
    method: "sunrise", latitude: 13.7563, longitude: 100.5018, utcOffsetHours: 7,
    timePrecision: "minute",
  },
  planetaryTimeReference: { civilUtcOffsetSeconds: 7 * 3600, referenceUtcOffsetSeconds: 6 * 3600 + 42 * 60 + 4 },
})
console.log(seasonal.timing.sunrise?.roundedTimeMinutes) // 352 = 05:52
```

This option supports CE 1900–2100, retains unrounded sunrise internally and does not add the province correction again. Supply the civil UTC offset yourself. Sunrise can be calculated abroad; the ascendant still uses fixed classical rising durations and planetary positions use traditional local civil time unless a separate reference clock is selected. It is not a worldwide geometric ascendant engine. See [`calculateSunrise()` and no-rise handling](docs/api-en.md#coordinate-based-sunrise).

Select a province to fill coordinates; the engine calculates sunrise automatically for the chart's date:

```ts
import { calculateThaiHoroscope, createSunriseReference, getThaiAstrologyProvinceLocations, getThaiAstrologyCountries } from "thai-astrology"

const provinceOptions = getThaiAstrologyProvinceLocations() // 77 provinces with editable coordinates
const countryOptions = getThaiAstrologyCountries() // 250 country/territory labels in English
const reference = createSunriseReference({ province: "กรุงเทพมหานคร", utcOffsetHours: 7 })
const provincial = calculateThaiHoroscope({
  date: { year: 2024, era: "CE", month: 6, day: 21 },
  time: { hour: 8, minute: 30 },
  ascendantReference: reference,
  planetaryTimeReference: {
    civilUtcOffsetSeconds: Math.round(reference.utcOffsetHours * 3600),
    referenceUtcOffsetSeconds: 6 * 3600 + 42 * 60 + 4,
  },
})
console.log(provincial.timing.sunrise?.roundedTimeMinutes) // 352 = 05:52
```

Default coordinates represent provincial seats from [GeoNames](https://www.geonames.org/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); the dataset is reduced to coordinates and names used by the library. Supply both `latitude` and `longitude` to `createSunriseReference()` to override the seat with a precise birthplace. Abroad, supply both coordinates and the civil offset including DST on that date; `countryCode`, such as `"US"`, is optional. Country labels have no implied coordinates or national UTC offset. Offsets remain explicit, including historical Thai dates. See [foreign examples and location records](docs/api-en.md#province-and-country-selection).

**Select a country → search cities → fill coordinates and resolve the birth-date UTC offset automatically:**

```ts
import { calculateThaiHoroscope, searchThaiAstrologyLocations, createSunriseReferenceForLocation } from "thai-astrology"

const civilTime = { yearCe: 2024, month: 6, day: 21, hour: 8, minute: 30 }
const result = searchThaiAstrologyLocations({ countryCode: "US", query: "New York" })
const city = result.items[0]
if (!city) throw new Error("Location not found")
const reference = createSunriseReferenceForLocation({ locationId: city.id, civilTime })
console.log(reference.utcOffsetHours) // -4 (EDT)
const chart = calculateThaiHoroscope({
  date: { year: civilTime.yearCe, era: "CE", month: civilTime.month, day: civilTime.day },
  time: { hour: civilTime.hour, minute: civilTime.minute },
  ascendantReference: reference,
  planetaryTimeReference: {
    civilUtcOffsetSeconds: Math.round(reference.utcOffsetHours * 3600),
    referenceUtcOffsetSeconds: 6 * 3600 + 42 * 60 + 4,
  },
})
console.log(chart.timing.sunrise?.roundedTimeMinutes) // 325 = 05:25
```

`countryCode` now filters actual location records. Search returns coordinates and an IANA timezone; the reference helper uses `Intl` to resolve the birth date/time offset, including DST and historical rules. The starter catalog contains 1,945 points in 243 countries/territories, including all 77 Thai provincial seats, rather than every city. Countries without catalog points still accept manual coordinates. Edited coordinates require a confirmed timezone or explicit UTC offset. Repeated DST times require `earlier`/`later`; nonexistent times are rejected. Rules depend on the runtime's timezone database. See [examples and limits](docs/api-en.md#country-scoped-location-search-and-offsets).

### Declare a planetary calculation clock

Optional `planetaryTimeReference` requires both `civilUtcOffsetSeconds` (birth-time offset including DST) and `referenceUtcOffsetSeconds` (the chosen calculation frame), as integer seconds within ±50,400. It converts planetary time with date carry; Thai lunar dates, Taksa and the ascendant's civil clock retain the original input. No meridian is inferred from a province.

```ts
const framed = calculateThaiHoroscope({
  date: { year: 2024, era: "CE", month: 1, day: 1 },
  time: { hour: 0, minute: 0 },
  planetaryTimeReference: {
    civilUtcOffsetSeconds: 7 * 3600,
    referenceUtcOffsetSeconds: 6 * 3600 + 42 * 60 + 4,
  },
})
console.log(framed.diagnostics.planetaryTime?.dayOffset) // -1
console.log(framed.diagnostics.planetaryTime?.secondOfDay) // 85324 = 23:42:04
```

This +06:42:04 example is an IANA-derived Bangkok frame, not a universal Suriyayatra default. Omitting the option preserves existing results and clocks. Combine with `ascendantReference` using the same civil offset. See [usage](docs/api-en.md#planetary-clock-reference).

### Traditional calculations

For the existing time frame, omit `planetaryTimeReference` and `ascendantReference`. Planets use the entered civil time directly; the ascendant uses 06:00 with the province correction. Omitting `location` applies zero correction. The current lunar calendar is shared by both approaches. `generateThaiAstrologyChart()` without `method` still uses legacy.

### Planetary positions, ascendants and horoscope results

| Result section | Available data |
| --- | --- |
| `points` | Planetary and ascendant positions, lunar mansion/Rerk data and planetary dignities; for example, `points.moon` |
| `houses` | All 12 houses, their rulers and occupants |
| `factors` | Ascendant ruler (`ascendantRuler`), Tanuseth and ascendant occupants (`ascendantOccupants`) |
| `charts` | Positions and channels for Rasi (ราศีจักร), navamsa (นวางค์จักร) and drekkana (ตรียางค์จักร) charts |
| `calendar` | Astrological weekday, geometric lunar phase and Thai lunar calendar date |
| `taksa` | บริวาร, อายุ, เดช, ศรี, มูละ, อุตสาหะ, มนตรี and กาลกิณี |
| `relationships` | Sign-based conjunctions, oppositions, trines, quadrangular groups (จตุโกณ) and sextiles |

Zodiac indices start at Aries = 0; house numbers start at ตนุ = 1. Chart channels run from Aries to Pisces, while `houses` start from the ascendant. Absolute longitudes are available in degrees (`longitudeDegrees`) and arcminutes (`longitudeArcMinutes`).

Read the ascendant, its ruler, Tanuseth, Taksa and Thai lunar date from the quick-start `horoscope`:

```ts
// Use horoscope from the quick-start example
console.log(horoscope.points.ascendant.signName) // กันย์ (Virgo)
console.log(horoscope.points[horoscope.factors.ascendantRuler].nameThai) // พุธ (Mercury)
console.log(horoscope.factors.tanuseth.nameThai) // พฤหัสบดี (Jupiter)
console.log(horoscope.taksa.kalakini) // 6 = Venus
console.log(horoscope.calendar.thaiLunarDate?.label) // ข๑๓ด๑๐
```

See the [API guide](https://github.com/kongesque/thai-astrology/blob/main/docs/api-en.md) for fields, units and further examples.

### Read a Thai lunar date

`calendar.thaiLunarDate` gives the waxing/waning day and lunar month. Read `phase`, `day` and `month`, or use `label` for abbreviated Thai text. The second eighth month has `month: 8` and `secondEighthMonth: true`.

```ts
import { calculateThaiHoroscope } from "thai-astrology"

const { calendar } = calculateThaiHoroscope({
  date: { year: 2567, era: "BE", month: 9, day: 15 },
  time: { hour: 12, minute: 0 },
})

console.log(calendar.thaiLunarDate?.label) // ข๑๓ด๑๐ = waxing 13, month 10
```

Supports CE **1582–2076** (BE **2125–2619**); outside this range the value is `null`. Dates can differ from published calendars. `calendar.lunarDay` describes the Moon-Sun angle and can differ from the calendar day. See the [lunar calendar API guide](https://github.com/kongesque/thai-astrology/blob/main/docs/api-en.md#thai-lunar-calendar-calendarthailunardate) for an example and limits.

## Compare planetary transits with a natal chart

Supply natal and transit dates and times using the same input shape:

```ts
import { calculateHoroscopeTransits, createSunriseReference } from "thai-astrology"

const ascendantReference = createSunriseReference({ province: "เชียงใหม่", utcOffsetHours: 7 })
const planetaryTimeReference = {
  civilUtcOffsetSeconds: 7 * 3600,
  referenceUtcOffsetSeconds: 6 * 3600 + 42 * 60 + 4,
}
const result = calculateHoroscopeTransits({
  date: { year: 2024, era: "CE", month: 9, day: 15 },
  time: { hour: 8, minute: 30 },
  ascendantReference,
  planetaryTimeReference,
}, {
  date: { year: 2025, era: "CE", month: 9, day: 15 },
  time: { hour: 8, minute: 30 },
  ascendantReference,
  planetaryTimeReference,
})

console.log(result.transit.points.sun.signName)
console.log(result.comparison.sun.longitudeDifferenceDegrees)
```

Both dates use Chiang Mai and UTC+7. For different places or DST periods, resolve each dated offset and construct each reference separately.

The result contains `natal`, `transit` and `comparison`. Both dates and times are explicit; the API does not automatically use the current time.

## Thai astrology API reference

| API | Use it for |
| --- | --- |
| `calculateThaiHoroscope(input)` | A complete structured natal horoscope |
| `calculateHoroscopeTransits(natalInput, transitInput)` | Natal/transit horoscopes and comparisons |
| `validateHoroscopeInput(input)` | Validating form or API input; returns `valid` and `issues` for invalid input |
| `getThaiAstrologyProvinces()` | Province selectors with local-time corrections |
| `getThaiAstrologyProvinceLocations()` | 77 provincial-seat points for sunrise selection |
| `getThaiAstrologyCountries()` | English country/territory names and codes for selectors |
| `createSunriseReference(selection)` | Resolve a provincial seat or precise coordinates into a sunrise option |
| `searchThaiAstrologyLocations(input)` | Country-scoped place search with coordinates, timezone, total and pagination |
| `createSunriseReferenceForLocation(input)` | Create a reference using a selected place and date-aware or explicit offset |
| `resolveCivilTimeOffset(input, timeZone)` | Resolve civil time in a named zone, with gap/overlap handling |
| `calculateSunrise(input)` | Sunrise at an explicit date, coordinates and UTC offset, or `status: "no-rise"` |
| `calculateDetailedPositions(input)` | Detailed Suriyayatra results using `CalculationInput` |
| `generateThaiAstrologyChart(input)` | The earlier chart API, which defaults to `legacy` |

`validateHoroscopeInput` reports invalid input without throwing. `calculateThaiHoroscope` and `calculateHoroscopeTransits` throw `HoroscopeInputError` with `issues`. See [HoroscopeInput / ThaiHoroscope](src/horoscope.ts) and [CalculationInput](src/engine/astro-calculation.ts) for full types.

**Calculation method:** `calculateThaiHoroscope` and `calculateDetailedPositions` always use Suriyayatra. For `generateThaiAstrologyChart`, select `method: "suriyayatra"` to use the same method. In the earlier input shape, `yearBe` means Buddhist Era and `yearBc` means **Common Era**. Supply one year field.

## Calculation rules and limitations

- **Classical Suriyayatra rules.** Results can differ from modern astronomical ephemerides or other astrological traditions. The library supplies interpretation data rather than finished predictions.
- **Local civil time.** Numeric inputs require a known offset including DST; the optional IANA adapter can resolve one. Province corrections shift the default 06:00 reference; they are not UTC offsets. Select coordinate sunrise with `ascendantReference`; the ascendant still uses fixed rising durations and holds the Sun at its birth-time position. The UTC offset in `ascendantReference` affects sunrise. Select `planetaryTimeReference` separately to convert planetary time.
- **Bounded coverage and precision.** Civil dates accept CE 1-9999. Thai lunar dates support BE 2125-2619; outside that range, `calendar.thaiLunarDate` is `null`. Planetary positions use integer arcminutes; ascendant minutes may be fractional. Houses use the whole-sign system.
- **Calendar conventions.** Taksa changes day at 06:00 without substituting Rahu for Wednesday-night Mercury. Thai lunar dates change at midnight and are separate from geometric lunar phase. Thai Ketu follows its own 679-day cycle.
- **Position comparisons.** Relationships are sign-based. Degree aspects with orbs, instantaneous speeds, retrograde status and ingress searches are not implemented. Longitude differences are not instantaneous speeds, and sign-start schedules are not precise future ingress times.

## Development and contributions

Use Node.js 24 for development and check changes before submitting:

```bash
git clone https://github.com/kongesque/thai-astrology.git
cd thai-astrology
npm ci
npm run check
```

`npm run check` validates TypeScript, runs behavior tests and verifies installed-package consumers. CI tests Node.js 16, 22 and 24. Edit code in `src/`; regenerate the chart illustration with `npm run docs:chart`.

Report bugs or suggest improvements through [GitHub Issues](https://github.com/kongesque/thai-astrology/issues). For calculation differences, include the date, local time, province, method and expected result, without names or personal details.

Released under the [MIT License](LICENSE).

Formula, open-data and licensing references: [SOURCES.md](SOURCES.md).
