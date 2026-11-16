# Thai astrology API guide

[README](../README-en.md) · [ภาษาไทย](api.md)

This guide covers the data used to display charts and write interpretation rules. Start with `calculateThaiHoroscope()` and read the sections you need. Results are JSON-serializable; planet, sign, house and Rerk names are returned in Thai.

Choose a task: [Thai birthplace](#input-and-main-apis) · [city search and DST](#country-scoped-location-search-and-offsets) · [precise coordinates](#province-and-country-selection) · [chart fields](#planetary-positions-and-ascendant-points) · [transits](#transit-comparisons) · [form validation](#validation-and-full-types) · [when to use 06:00](#0600-reference).

## Input and main APIs

For a Thai birthplace, supply a date, local time and province. For CE 1900–2100, the API calculates daily sunrise at the provincial seat and resolves the birth time’s UTC offset. No time-correction setting is required.

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

## Display the result

Use `horoscope` from the first example. Render the 12 Rasi channels in Aries-to-Pisces order; your app supplies the chart layout. For a position table, read each entry in `points`.

```ts
const channels = horoscope.charts.rasi.channels.thai
const positions = Object.values(horoscope.points).map(point => ({
  name: point.nameThai,
  sign: point.signName,
  degrees: point.degrees,
  minutes: point.minutes,
}))
console.log(channels)
console.log(positions)
```

Planetary minutes are integers; ascendant minutes can be fractional. Preserve the returned number in stored data and choose display precision separately. The channels already contain `ลั` and `*` markers; you do not need to reconstruct them.

## Planetary positions and ascendant: `points`

`points.ascendant` holds the ascendant. Planets use the following keys. Planet numbers are used in Taksa and relationships; they are separate from zodiac indices.

| Key | Thai name | Planet number |
| --- | --- | --- |
| `sun` | อาทิตย์ | 1 |
| `moon` | จันทร์ | 2 |
| `mars` | อังคาร | 3 |
| `mercury` | พุธ | 4 |
| `jupiter` | พฤหัสบดี | 5 |
| `venus` | ศุกร์ | 6 |
| `saturn` | เสาร์ | 7 |
| `rahu` | ราหู | 8 |
| `ketu` | เกตุ | 9 |
| `uranus` | มฤตยู | 0 |

Each point has these fields. `points.ascendant.number` is `null`.

| Field | Meaning and units |
| --- | --- |
| `key`, `nameThai`, `number` | Point key, Thai name and planet number |
| `sign`, `signName` | Zodiac index 0-11 and Thai sign name, Aries = 0 through Pisces = 11 |
| `degrees`, `minutes` | Degrees 0-29 and arcminutes from 0 to less than 60 within the sign; ascendant minutes can be fractional |
| `longitudeDegrees` | Absolute longitude from Aries, 0 to less than 360 degrees |
| `longitudeArcMinutes` | Absolute longitude, 0 to less than 21600 arcminutes; 60 arcminutes = 1 degree |
| `house` | Occupied whole-sign house 1-12 relative to the ascendant |
| `ruledHouses` | House numbers ruled by the planet; may be empty |
| `dignities` | Thai dignity labels such as `"เกษตรบดี"`, `"มหาอุจ"`, `"นิจ"`; may contain multiple labels or be empty |

Lunar mansion/Rerk and divisional data are available on the same point:

The zodiac is divided into 27 lunar mansions, each with four quarters (บาทฤกษ์). `rerk` identifies one of nine Rerk categories, such as มหันธโนฤกษ์ or ภูมิปาโลฤกษ์, separately from the mansion index in `nakshatraIndex`.

| Field | Data |
| --- | --- |
| `rerk` | Rerk name for the position, such as `"ภูมิปาโลฤกษ์"`; read the Moon's Rerk from `points.moon.rerk` |
| `nakshatraIndex`, `nakshatraName` | Lunar mansion index 0-26 and name |
| `nakshatraQuarter`, `nakshatraQuarterName`, `nakshatraQuality` | Quarter 1-4, its name and descriptive text |
| `nakshatraMinutes` | Progress within the mansion, scaled to 60 parts and rounded down; not absolute arcminutes |
| `navamsaSign`, `navamsaRuler`, `navamsaSection` | Navamsa sign 0-11, its ruler's planet number and section 1-9 within the original sign |
| `drekkanaSign`, `drekkanaRuler`, `drekkanaSection` | Drekkana sign 0-11, its ruler's planet number and section 1-3 within the original sign |
| `navamsaName`, `drekkanaName` | Navamsa and drekkana names |
| `navamsaQuality`, `drekkanaQuality` | Descriptive text, or `null` when absent |

The ascendant and Uranus have no dignity labels in this calculation profile. Returned labels can differ in spelling from some texts: `"มหาอุจ"` is commonly written “มหาอุจจ์”. Match the API's returned spelling when comparing strings.

## Houses, rulers, Tanulak and Tanuseth

`houses` contains 12 houses, starting at `houses[0]` = ตนุ. The system is `whole-sign`: the ascendant's sign is house 1.

| Field | Data |
| --- | --- |
| `houses[i].number`, `.nameThai` | House number and name: ตนุ, กดุมภะ, สหัชชะ, พันธุ, ปุตตะ, อริ, ปัตนิ, มรณะ, ศุภะ, กัมมะ, ลาภะ, วินาศะ |
| `houses[i].sign`, `.signNameThai` | House sign index 0-11 and Thai name |
| `houses[i].ruler` | House ruler with `key`, `number`, `nameThai` and the `house` occupied by that ruler |
| `houses[i].occupants` | Keys of planets occupying the house; may be empty |
| `houses[i].containsAscendant` | `true` for house 1 |
| `factors.ascendantRuler` | Tanulak (ตนุลัคน์), the ascendant sign's ruler; use `points[key]` for its name and position |
| `factors.tanuseth` | Tanuseth (ตนุเศษ), with `key`, `number`, `nameThai` and `calculation` for inspecting calculation steps |
| `factors.ascendantOccupants` | Keys of planets sharing the ascendant's sign; identical to the occupants of house 1 |

Tanulak is the ascendant sign's ruler. Tanuseth is derived by its own calculation, while ascendant occupants are determined from planetary positions. These values need not refer to the same planet.

## Thai lunar calendar: `calendar.thaiLunarDate`

Use this field for the waxing/waning day and lunar month. Supply a Gregorian date and local civil time; `time` is required and `location` is optional. Supported years are CE **1582–2076** (BE **2125–2619**). Outside this range, the field is `null`.

```ts
import { calculateThaiHoroscope } from "thai-astrology"

const { calendar } = calculateThaiHoroscope({
  date: { year: 2026, era: "CE", month: 7, day: 29 },
  time: { hour: 12, minute: 0 },
})
const lunar = calendar.thaiLunarDate

if (lunar) {
  const phase = lunar.phase === "waxing" ? "ขึ้น" : "แรม"
  const month = lunar.secondEighthMonth ? "8 หลัง" : String(lunar.month)
  console.log(`${phase} ${lunar.day} ค่ำ เดือน ${month}`) // ขึ้น 15 ค่ำ เดือน 8 หลัง
}
```

| Field | Meaning |
| --- | --- |
| `phase` | `"waxing"` = ขึ้น; `"waning"` = แรม |
| `day` | Day 1–15 of that phase; a 29-day month ends on waning day 14 |
| `month` | Lunar month 1–12, separate from the Gregorian input month |
| `secondEighthMonth` | `true` for the second eighth month; both eighth months return `month: 8` |
| `yearType` | `"ordinary"` = ปกติมาส ปกติวาร (354 days); `"intercalary-month"` = อธิกมาส (adds a second eighth month, 384 days); `"intercalary-day"` = อธิกวาร (adds a day to month 7, 355 days) |
| `dayBoundary` | `"civil-midnight"`: local 00:00 is the civil-day boundary |
| `label` | Abbreviated Thai text, e.g. `"ข๑๓ด๑๐"`; `ด๘๘` means the second eighth month. Can contain alignment spaces; format from the fields rather than parsing it |

The calculation uses annual calendar tables and can differ from published calendars, particularly in intercalation and around the Chula Sakarat new year. `yearType` follows the calculated Chula Sakarat year and can change at the Thaloeng Sak time. The supported range does not guarantee accuracy for every date.

| Other `calendar` fields | Meaning |
| --- | --- |
| `civilWeekday` | Civil weekday, changing at 00:00; 1 = Sunday through 7 = Saturday |
| `astrologicalWeekday` | Astrological weekday, changing at 06:00; same numbering |
| `lunarPhase`, `lunarDay` | Phase and lunar day 1–15 derived from the Moon-Sun angle; can differ from `thaiLunarDate` |
| `elongationDegrees` | Moon's angular distance from the Sun, 0 to less than 360 degrees |
| `julianDayNumber`, `horakhun`, `chulaSakarat` | Julian day number, Horakhun day count and Chula Sakarat year |

For 15 September 2024 at 08:30 in Chiang Mai, `lunarDay` is 12 while `thaiLunarDate.day` is 13. Use `thaiLunarDate.phase` and `.day` together for a calendar display.

## Taksa: `taksa`

| Field | Thai category |
| --- | --- |
| `boriwan` | บริวาร |
| `ayu` | อายุ |
| `det` | เดช |
| `si` | ศรี |
| `mula` | มูละ |
| `utsaha` | อุตสาหะ |
| `montri` | มนตรี |
| `kalakini` | กาลกิณี |

Each category returns a planet number, not a name: `kalakini: 6` means Venus. `method` is `"weekday-0600"`; `center` is 9 (Ketu). The day changes at 06:00 without replacing Wednesday-night Mercury with Rahu.

## Chart channels and relationships

`charts.rasi`, `charts.navamsa` and `charts.drekkana` are the Rasi, navamsa and drekkana charts. Each has `positions` containing planet/ascendant sign indices, plus `channels.thai` / `channels.arabic`: 12 strings ordered Aries through Pisces. `ลั` marks the ascendant; `*` marks Tanuseth.

`relationships` also contains 12 entries in zodiac order. Each has `sign` (zodiac index) and `ruler` (planet number). The following arrays contain **planet numbers**:

| Field | Position, counting the reference sign as 1 |
| --- | --- |
| `conjunction` | กุม: planets in the same sign |
| `opposition` | เล็ง: 7th sign |
| `trines[0]`, `trines[1]` | ตรีโกณ: 5th and 9th signs |
| `squares[0]`, `squares[1]`, `squares[2]` | จตุโกณ group: 4th, 7th and 10th signs, including the opposition |
| `sextiles[0]`, `sextiles[1]` | โยค: 3rd and 11th signs |

These relationships use signs, without checking exact degree aspects or orbs.

## Transit comparisons

Supply natal and transit inputs separately. Each chart uses its own date, time and location. This example uses Chiang Mai in two years; for a transit location abroad, prepare its location and offset using the city example.

```ts
import { calculateHoroscopeTransits } from "thai-astrology"
import type { HoroscopeInput } from "thai-astrology"

function inputForYear(year: number): HoroscopeInput {
  return {
    date: { year, era: "CE", month: 9, day: 15 },
    time: { hour: 8, minute: 30 },
    location: { province: "เชียงใหม่" },
  }
}
const result = calculateHoroscopeTransits(inputForYear(2024), inputForYear(2025))

console.log(result.transit.points.sun.signName)
console.log(result.comparison.sun.longitudeDifferenceDegrees)
```

`calculateHoroscopeTransits(natalInput, transitInput)` accepts two inputs of the same shape and returns `natal`, `transit` and `comparison`. Both dates and times must be supplied explicitly.

| Field | Meaning |
| --- | --- |
| `transit.points[key]` | Transit position at the supplied time; `house` is relative to the transit ascendant |
| `comparison[key].natalHouse` | Transit planet's house relative to the natal ascendant, 1-12 |
| `comparison[key].longitudeDifferenceDegrees` | Shortest signed difference between transit and natal longitude for the same planet, from -180 to less than 180 degrees |

`comparison` contains planet keys only, excluding the ascendant. Longitude difference is not accumulated orbital motion, instantaneous speed or retrograde status.

## Validation and full types

Convert numeric form fields before building chart input: `"8"` is a string, while `8` is an hour. Require nonempty values before conversion. Validate `date`/`time` first; for a foreign birthplace, resolve the location and offset before assembling the full input. The final chart input can be validated again with its settings.

```ts
import { validateHoroscopeInput } from "thai-astrology"

const formInput: unknown = {
  date: { year: 2024, era: "CE", month: 9, day: 15 },
  time: { hour: 8, minute: 30 },
}
const validation = validateHoroscopeInput(formInput)
if (!validation.valid) {
  console.log(validation.issues) // Map each issue.field to its form field.
} else {
  console.log(validation.value.date.yearCe) // 2024
}
```

`validateHoroscopeInput()` accepts `unknown` without coercing strings to numbers. Invalid results include `issues` with `field`, `code` (`required`, `type`, `range`, `unknown`) and `message`. A valid `value` contains normalized data, including both `date.yearBe` and `date.yearCe`, the selected references and any fallback reason. It is not the input shape to pass back to the calculation API.

`calculateThaiHoroscope()` and `calculateHoroscopeTransits()` throw `HoroscopeInputError` for invalid input; read details from `error.issues`. Full types, including `profile`, `timing` and `diagnostics`, are in [horoscope.ts](../src/horoscope.ts), [DetailedPosition](../src/engine/astro/suriyayatra.ts) and [CalculationInput](../src/engine/astro-calculation.ts).

Read the [calculation rules and limitations](../README-en.md#calculation-rules-and-limitations) before using the results.

## Function and input reference

| Input field | Type and constraints |
| --- | --- |
| `date.year`, `date.era` | Integer year; `"BE"` for Buddhist Era 544-10542 or `"CE"` for Common Era 1-9999 |
| `date.month`, `date.day` | Integer month 1-12 and a valid day in the Gregorian calendar |
| `time.hour`, `time.minute` | Integer local civil hour 0-23 and minute 0-59 |
| `location.province` | Optional full Thai province name or case-insensitive ISO 3166-2:TH code, such as `TH-50` (เชียงใหม่) |

These settings are for custom time references. See [advanced settings](#advanced-settings) for working examples.

| Additional input | Type and constraints |
| --- | --- |
| `location.localTimeCorrectionMinutes` | Optional finite minutes from -1440 to 1440; overrides the province correction |
| `referenceMode` | Omit for general use; set `"traditional"` for the [06:00 reference](#0600-reference). The parameter default is `"auto"` |
| `planetaryTimeReference` | Optional integer `civilUtcOffsetSeconds` and `referenceUtcOffsetSeconds`, each within ±50,400 |
| `ascendantReference` | Optional `method: "sunrise"`, latitude (-90..90), longitude (-180..180) and `utcOffsetHours` (-14..14) including DST |

For the 06:00 reference, omitting both province and correction applies zero correction. Unknown province names require an explicit correction. The correction shifts the ascendant's 06:00 reference; it is not a timezone or UTC offset. Foreign births require a resolved timezone/DST offset or an explicitly supplied offset.

| API | Result |
| --- | --- |
| `calculateThaiHoroscope(input)` | `ThaiHoroscope`: a structured natal horoscope, always using Suriyayatra |
| `calculateHoroscopeTransits(natalInput, transitInput)` | Natal and transit horoscopes with comparisons |
| `validateHoroscopeInput(input)` | `{ valid: true, value }` or `{ valid: false, issues }`, without throwing for invalid input |
| `getThaiAstrologyProvinces()` | All 77 provinces, each with `province`, `provinceCode` and `localTimeCorrectionMinutes` |
| `calculateMeanSolarTimeCorrection(input)` | Unrounded civil-minus-mean-solar minutes from longitude and UTC offset |
| `getThaiAstrologyProvinceLocations()` | 77 provincial-seat points for sunrise selection |
| `getThaiAstrologyCountries()` | English country/territory names and codes for selectors |
| `createSunriseReference(selection)` | Resolve a provincial seat or precise coordinates into a sunrise option |
| `searchThaiAstrologyLocations(input)` | Country-scoped place search with coordinates, timezone, total and pagination |
| `createSunriseReferenceForLocation(input)` | Create a reference using a selected place and date-aware or explicit offset |
| `resolveCivilTimeOffset(input, timeZone)` | Resolve civil time in a named zone, with gap/overlap handling |
| `calculateSunrise(input)` | Sunrise at an explicit date, coordinates and UTC offset, or `status: "no-rise"` |
| `calculateDetailedPositions(input)` | Detailed Suriyayatra positions and related data; accepts `CalculationInput` |
| `generateThaiAstrologyChart(input)` | The earlier chart API; defaults to `legacy`, with optional `method: "suriyayatra"` |

The earlier input shape uses `day`, `monthTh`, `hour`, `minute`, `province` and one year field: `yearBe` is Buddhist Era; `yearBc` is **Common Era**, despite its name. For example, `yearBe: 2567` equals `yearBc: 2024`.

### Missing birth information

Birth time is required; there is no date-only mode or assumed default hour. If you use an estimated time, retain that assumption and avoid treating ascendant-dependent results as certain. With an unknown province, omit `location`: this uses the 06:00 reference with zero correction. A location-aware calculation instead needs coordinates and a known civil offset; a country label alone is insufficient.

## Advanced settings

Use these sections for a birth abroad, precise coordinates or a specific time-reference convention. For a recognized Thai province in CE 1900–2100, the first example is sufficient.

### Sunrise and planetary time settings

The first example uses **sunrise for the date and location** as the ascendant reference, rounded to the nearest minute. Planetary calculation time is converted from the local clock to the +06:42:04 frame. Province coordinates and the dated UTC offset are filled in; no method selector is needed.

The +06:42:04 frame comes from historical Bangkok civil time. It is a library convention, not a universal reference for Suriyayatra formulas. See [SOURCES.md](../SOURCES.md).

When no explicit reference is supplied, dates outside the supported years, a missing province or a custom correction cause the API to use the [06:00 reference](#0600-reference) instead. Retain the applied reference when saving or displaying a chart:

| Result field | Meaning |
| --- | --- |
| `profile.referenceMode` | `"auto"` = daily provincial sunrise, `"traditional"` = 06:00 reference, `"explicit"` = supplied references |
| `profile.referenceFallback` | Why the 06:00 reference was used instead: `"year-out-of-range"`, `"missing-province"` or `"explicit-correction"`; absent when no fallback occurred |
| `input.ascendantReference`, `input.planetaryTimeReference` | Resolved coordinates, precision and time references; retain them to repeat the calculation with the same values |
| `timing.referenceTimeMinutes` | Applied ascendant reference, in minutes after midnight |

Supplying either `ascendantReference` or `planetaryTimeReference` uses the supplied settings as-is and **does not fill in the other reference**. Supply both, as in the coordinate or city examples below, to follow the first example's convention. Do not add a province correction to sunrise.

Dated UTC resolution uses runtime IANA rules through `Intl`. Invalid or ambiguous local times are errors; they do not trigger a fallback to 06:00. To repeat a result across runtime versions, retain both resolved references and pass them explicitly.

Different references can put the ascendant in different signs at the same birth time. Use one convention throughout interpretation. For an estimated birth time, check sign boundaries for the date, location and reference used; no single uncertainty threshold in minutes applies to every chart.

### Coordinate-based sunrise

```ts
import { calculateSunrise, calculateThaiHoroscope } from "thai-astrology"

const reference = {
  method: "sunrise" as const, latitude: 13.7563, longitude: 100.5018, utcOffsetHours: 7,
  timePrecision: "minute" as const,
}
const event = calculateSunrise({ yearCe: 2024, month: 6, day: 21, ...reference })
if (event.status === "rise") console.log(event.roundedTimeMinutes) // 352 = 05:52

const chart = calculateThaiHoroscope({
  date: { year: 2024, era: "CE", month: 6, day: 21 },
  time: { hour: 8, minute: 30 },
  ascendantReference: reference,
  planetaryTimeReference: {
    civilUtcOffsetSeconds: Math.round(reference.utcOffsetHours * 3600),
    referenceUtcOffsetSeconds: 6 * 3600 + 42 * 60 + 4,
  },
})
console.log(chart.timing.sunrise?.timeMinutes) // unrounded minutes from local midnight
```

Coordinates are in degrees, positive north and east; UTC offsets are in hours. Optional `ascendantReference` requires `method: "sunrise"`, latitude (-90..90), longitude (-180..180) and civil `utcOffsetHours` (-14..14), including DST. `calculateSunrise()` accepts `yearCe`, `month`, `day` and the same coordinates/offset. Both support CE 1900–2100 in Thailand or abroad. The NOAA/Meeus model uses a sea-level solar-center altitude of −50′, without terrain, elevation or actual weather corrections. Coordinates do not determine the civil timezone; no timezone/DST lookup is performed.

`calculateSunrise()` returns the fields below. If the date has no sunrise, it returns `status: "no-rise"`; using that reference in a horoscope throws `RangeError`. To use 06:00 instead, follow the [reference example below](#0600-reference). In a low-level call, omit `ascendantReference`.

| Field when `status: "rise"` | Meaning |
| --- | --- |
| `timeMinutes` | Unrounded sunrise, in minutes after midnight, from 0 to less than 1440 |
| `roundedTimeMinutes` | Nearest-minute sunrise; may be 1440, or 24:00 |
| `altitudeResidualDegrees` | Numerical solution residual, not physical accuracy |

For the ascendant, the example uses `timePrecision: "minute"`, as does provincial selection in the first example. Omitting this field from an explicit reference, or choosing `"continuous"`, uses unrounded sunrise. Both location helpers accept it.

Precision affects only the ascendant reference and the twelve sign-start times. It does not change raw sunrise, planetary positions or lunar dates. A rounded 24:00 becomes 00:00 within the ascendant cycle without moving the civil date.

The province correction is zero. A simultaneous nonzero `localTimeCorrectionMinutes` is rejected. The option is also available on `CalculationInput`; the chart wrapper requires `method: "suriyayatra"`.

`ascendantReference` changes the ascendant reference. Rising durations remain fixed and the Sun is held at its birth-time position. Without `planetaryTimeReference`, planetary positions retain the civil-local clock; the sunrise offset alone does not shift planetary calculations. This is not a worldwide geometric ascendant or modern planetary ephemeris.

### Province and country selection

Use `provinceCode` as the stored reference or option value and `province` as the full Thai display label. Codes such as `TH-50` (Chiang Mai) and `TH-10` (Bangkok) follow ISO 3166-2:TH; lowercase code inputs are accepted. The existing full Thai names remain valid. Codes work in `location.province`, low-level `CalculationInput.province`, `calculateAscendant()` and `createSunriseReference()`. Structured validation and horoscope results normalize recognized codes to the full Thai province name.

```ts
import { getThaiAstrologyProvinces } from "thai-astrology"

const options = getThaiAstrologyProvinces().map(({ provinceCode, province }) => ({
  value: provinceCode,
  label: province,
}))
console.log(options.find(option => option.value === "TH-50"))
// { value: "TH-50", label: "เชียงใหม่" }
```

Use the province coordinates and country list to populate location selectors. A Thai province still works with `location: { province }` from the first example; you do not need to build references yourself.

```ts
import { getThaiAstrologyProvinceLocations, getThaiAstrologyCountries } from "thai-astrology"

const provinceOptions = getThaiAstrologyProvinceLocations()
const countryOptions = getThaiAstrologyCountries()
console.log(provinceOptions.length) // 77
console.log(countryOptions.length) // 250
```

Province records contain `province`, `provinceCode`, `countryCode: "TH"`, `latitude`, `longitude`, `timeZone: "Asia/Bangkok"`, `coordinateKind: "province-seat"` and `geonameId`. WGS84 coordinates represent provincial seats, not boundaries or every birthplace. `getThaiAstrologyProvinces()` instead returns province names, codes and 06:00 reference corrections derived from longitude in the UTC+7 frame, rounded to minutes. Both functions return fresh lists.

`createSunriseReference()` fills coordinates from `province` or accepts your own `latitude` and `longitude`. An explicit `utcOffsetHours` is always required. When a province and both coordinates are supplied, the coordinates take precedence; one coordinate cannot be mixed with a provincial default. This helper does not resolve timezones. Use the [city helper](#country-scoped-location-search-and-offsets) for date-aware UTC resolution.

Country records contain English names and two-letter codes, including GeoNames `XK` and excluding dissolved `AN`/`CS`. Optional `countryCode` values must be uppercase codes from the list. A country alone does not determine coordinates or DST, and borders are not checked. A foreign country cannot be combined with a Thai province. Clear the previous place, coordinates and timezone when switching countries in a form.

Data is adapted from [GeoNames](https://www.geonames.org/), retrieved 4 October 2026, under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Records are reduced for selectors and retain the library's Thai province names. See [sources and licensing](../SOURCES.md).

### Country-scoped location search and offsets

Select a country, search for a city, then resolve the selected city’s offset at the birth date and time. New York on 21 June 2024 uses EDT, or UTC−4; DST does not need a separate input.

```ts
import { calculateThaiHoroscope, searchThaiAstrologyLocations, createSunriseReferenceForLocation } from "thai-astrology"

const civilTime = { yearCe: 2024, month: 6, day: 21, hour: 8, minute: 30 }
const result = searchThaiAstrologyLocations({ countryCode: "US", query: "New York" })
const city = result.items[0]
if (!city) throw new Error("Location not found")
const reference = createSunriseReferenceForLocation({ locationId: city.id, civilTime, timePrecision: "minute" })
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

`searchThaiAstrologyLocations()` returns `{ items, total }`, with `total` counted before pagination. Search supports English city names, Thai province names and province codes, ignoring case and Latin diacritics.

| Search input | Constraint |
| --- | --- |
| `countryCode` | Required code from `getThaiAstrologyCountries()` |
| `query` | Optional search text |
| `limit` | Page size; defaults to 50, maximum 100 |
| `offset` | Nonnegative integer start position |

Each place contains `id`, `countryCode`, `nameEnglish`, `latitude`, `longitude`, `timeZone`, `coordinateKind` and `geonameId`. Thai provinces also have `nameThai`, `province` and `provinceCode`. Results are fresh copies in stable order within the bundled dataset.

The starter catalog includes capitals, the ten largest source cities per country, a largest available source city per timezone and all 77 Thai provincial seats: 1,945 points in 243 countries/territories. It is not every city or every worldwide timezone. Countries without catalog records return `items: []`, without substituting another country's location. Manual coordinates remain supported. GeoNames CC BY 4.0 data is reduced without changing its coordinates or timezone names.

`createSunriseReferenceForLocation()` accepts a result's `locationId` or both coordinates. Optional `countryCode` must agree with the selected ID. Explicit `utcOffsetHours` takes precedence and bypasses `Intl`. Otherwise, supply `civilTime: { yearCe, month, day, hour, minute }`; the selected place's zone, or an explicit `timeZone`, resolves the offset at that birth date/time. CE 1900–2100 is supported.

Both coordinates can override a selected point. To resolve UTC for edited coordinates, supply a verified `timeZone` or a numeric offset. The helper does not infer a timezone from edited coordinates, which might cross a boundary. When switching countries in a form, clear the previous place, coordinates and timezone before selecting new values.

`resolveCivilTimeOffset(civilTime, timeZone, disambiguation?)` returns `timeZone`, `utcOffsetHours`, `utcEpochMilliseconds` and `ambiguous`. It uses runtime IANA rules through `Intl.DateTimeFormat`, without reading the host timezone or current clock. Default `disambiguation: "reject"` refuses repeated times; explicitly choose `"earlier"` or `"later"` when appropriate. Nonexistent times during forward clock changes or skipped dates are always rejected, rather than shifting a birth time.

Timezone resolution is separate from the calculation core, which accepts numeric offsets and returns the same results for identical inputs. Intl rules can differ by runtime/database version. For repeatable calculations, retain the resolved numeric offset and runtime version or supply a verified offset explicitly. Unsupported timezone names require a supported runtime or explicit offset.

The resolved UTC offset is based on the entered birth time and remains fixed throughout that date’s sunrise calculation. If DST changes that day, displayed sunrise still uses this offset rather than modeling an intraday clock change. The ascendant retains classical rising-duration tables; the planetary time frame is configured separately below.

### Planetary clock reference

`planetaryTimeReference` separates the **birthplace’s UTC offset** from the **planetary calculation frame**. It is supported by `calculateThaiHoroscope()`, `calculateDetailedPositions()` and the chart wrapper with `method: "suriyayatra"`, but not by `legacy`. Natal and transit inputs can use separate settings.

| Value | Unit and purpose |
| --- | --- |
| `civilUtcOffsetSeconds` | Birth-time UTC offset, including DST |
| `referenceUtcOffsetSeconds` | Planetary calculation frame; the examples use +06:42:04 = 24,124 seconds |

Both values are integer seconds within ±50,400. The formula is `reference time = local time − local offset + reference offset`, carrying across months and years. A reference date outside CE 1–9999 is rejected. `Math.round(utcOffsetHours * 3600)` in the examples converts hours back to integral seconds.

When combined with sunrise, both settings must use the same civil UTC offset. Ascendant time and sunrise remain local, though a changed Sun position can change the ascendant and houses. Thai lunar dates, calendar Chula Sakarat and Taksa retain the supplied civil date; geometric lunar phase follows the calculated Moon and Sun.

Low-level APIs do not fill this frame in: omitting it uses the entered local clock. The structured API supplies it for supported provincial inputs. Equal offsets preserve the original calculation time.

`diagnostics.planetaryTime` provides `horakhun`, `secondOfDay`, `dayOffset` and both offsets to inspect the converted time. This is fixed-offset conversion, not UT1/TT or leap-second modeling. `diagnostics.solarCycleUnits` is an internal value for selecting the epoch year; do not convert it directly into mean Sun near annual boundaries.

### 06:00 reference

Use this when following a source or system that specifies **06:00 with a longitude correction** as its ascendant reference, or for a date outside the sunrise range when you want to select this convention explicitly. Planetary calculations use the entered local clock time.

Set `referenceMode: "traditional"` and omit `ascendantReference` and `planetaryTimeReference`. This selects a time convention, using the same engine and calendar. It does not restore every result from earlier releases, since province corrections are now derived from coordinates.

```ts
import { calculateThaiHoroscope } from "thai-astrology"

const horoscope = calculateThaiHoroscope({
  date: { year: 2024, era: "CE", month: 9, day: 15 },
  time: { hour: 8, minute: 30 },
  location: { province: "เชียงใหม่" },
  referenceMode: "traditional",
})

console.log(horoscope.timing.referenceTimeMinutes) // 384 = 06:24
```

#### Coordinate-based mean solar correction

`calculateMeanSolarTimeCorrection({ longitude, utcOffsetHours })` returns civil clock time minus local mean solar time, in minutes: `60 × utcOffsetHours − 4 × longitude`. A positive value means the civil clock is ahead. Longitude is positive east (-180 to 180 degrees); the civil offset (-14 to 14 hours) must include DST at the birth time and may contain fractional hours.

Province corrections for the 06:00 reference use `Math.round(60 × 7 − 4 × longitude)` from provincial-seat coordinates. UTC+7 is this method's reference convention, not a historical timezone lookup. Supply `localTimeCorrectionMinutes` explicitly for a custom correction on a particular chart.

This example instead uses an unrounded correction and the dated civil offset:

```ts
import { calculateMeanSolarTimeCorrection, calculateThaiHoroscope, getThaiAstrologyProvinceLocations, resolveCivilTimeOffset } from "thai-astrology"

const birthplace = getThaiAstrologyProvinceLocations().find(place => place.province === "กรุงเทพมหานคร")
if (!birthplace) throw new Error("Province not found")
const civilTime = { yearCe: 2024, month: 6, day: 21, hour: 8, minute: 30 }
const { utcOffsetHours } = resolveCivilTimeOffset(civilTime, birthplace.timeZone)
const correction = calculateMeanSolarTimeCorrection({ longitude: birthplace.longitude, utcOffsetHours })
const chart = calculateThaiHoroscope({
  date: { year: civilTime.yearCe, era: "CE", month: civilTime.month, day: civilTime.day },
  time: { hour: civilTime.hour, minute: civilTime.minute },
  referenceMode: "traditional",
  location: { province: birthplace.province, localTimeCorrectionMinutes: correction },
})
console.log(correction.toFixed(5)) // 17.99424 minutes
console.log(chart.timing.referenceTimeMinutes) // Approximately 377.99424 minutes after midnight
```

The helper does not round, wrap across dates or resolve timezones. Use `Math.round(correction)` explicitly if whole minutes are required. The input bounds allow results up to ±1560 minutes, while chart `localTimeCorrectionMinutes` accepts only ±1440; values beyond that chart limit are rejected.

This correction excludes the equation of time, seasonal effects and latitude. It is not a daily sunrise prediction and does not guarantee closer ascendant agreement with another method. Use the first example or the coordinate example above for daily sunrise without adding this correction again. See the formula and scope in [SOURCES.md](../SOURCES.md).

## Agent tools and JSON schemas

Import `getThaiAstrologyTools()` and `executeThaiAstrologyTool()` from `thai-astrology/tools`; import `getThaiAstrologySchemas()` from `thai-astrology/schemas`. These optional entry points work with CommonJS, ESM imports and browser bundlers. They add no runtime dependencies and do not change the root exports or calculation defaults.

| Tool name | Arguments | Successful `data` |
| --- | --- | --- |
| `search_locations` | `AstrologyLocationSearch`: countryCode, optional query/limit/offset | `AstrologyLocationSearchResult` |
| `resolve_birthplace` | `BirthplaceResolutionInput`: date, time, location and optional clock settings | `ResolvedBirthplace` with ready `input` |
| `validate_horoscope_input` | `{ input: unknown }` | `HoroscopeInputValidation` |
| `calculate_horoscope` | `{ input: HoroscopeInput, sections?: HoroscopeSection[] }` | Full `ThaiHoroscope` by default, or selected sections |
| `calculate_transits` | `{ natal: HoroscopeInput, transit: HoroscopeInput, sections?: HoroscopeSection[] }` | Full `HoroscopeTransitResult` by default, or selected sections |

```ts
import { executeThaiAstrologyTool, getThaiAstrologyTools } from "thai-astrology/tools"
import { getThaiAstrologySchemas } from "thai-astrology/schemas"

const definitions = getThaiAstrologyTools()
const schemas = getThaiAstrologySchemas()
const input = {
  date: { year: 2024, era: "CE" as const, month: 9, day: 15 },
  time: { hour: 8, minute: 30 },
  location: { province: "TH-50" },
}
const result = executeThaiAstrologyTool("calculate_horoscope", { input })
if (result.ok) console.log(result.data.points.sun.longitudeDegrees)
else console.log(result.error.code, result.error.message, result.error.issues)

// JSON Schema documents can be serialized for other languages and services.
console.log(JSON.stringify(schemas.calculate_horoscope.inputSchema))
```

Each definition has `name`, `description`, `inputSchema` and `outputSchema`. Schema documents use JSON Schema 2020-12 and local `$defs`/`$ref`. They describe structural types; civil-date validity, numeric ranges, province recognition, reference conflicts and timezone rules are checked by the existing runtime APIs. They are generated from TypeScript types with `npm run schemas`; typecheck rejects stale schemas. Returned definitions and schemas are independent mutable copies.

The dispatcher accepts JSON-compatible arguments, rejects unknown fields in typed input objects and never coerces strings to numbers. The validation tool deliberately accepts arbitrary `input` so it can report invalid forms. Its result is `ok: true` even when `data.valid` is false: the validation itself completed successfully. Other tools return failures for invalid arguments or calculation inputs. Existing direct library APIs retain their earlier treatment of extra fields.

Results are either `{ schemaVersion: "1.0", ok: true, data }` or `{ schemaVersion: "1.0", ok: false, error: { code, message, issues? } }`. Output schemas describe this complete envelope. Error codes are:

| Code | Meaning |
| --- | --- |
| `UNKNOWN_TOOL` | Name is not one of the five tools |
| `INVALID_ARGUMENTS` | Argument shape, extra fields or location-search values are invalid |
| `INVALID_INPUT` | Horoscope domain validation failed; `issues` contains field/code/message records |
| `INVALID_BIRTHPLACE` | Invalid location, timezone, clock choice or unsupported resolution date |
| `AMBIGUOUS_CIVIL_TIME` | Repeated local time requires earlier/later or an explicit offset |
| `CALCULATION_ERROR` | A calculation could not complete, for example no sunrise at polar coordinates |

Transit validation prefixes issue fields with `natal.` or `transit.`. Structural failures include a field path in `message`. Unexpected programming errors propagate to the host application. Callers should use codes and issue fields for control flow; messages are explanatory text. Validation does not guarantee a sunrise exists for the requested day.

Results preserve all resolved references, fallback reasons, units, Thai labels and chart markers. Signs are zero-based and houses are 1–12. No current date, AI model or interpretation is selected automatically. A catalog location ID is not a province: for foreign births, use `createSunriseReferenceForLocation()` with an explicit civil time and any required DST choice, then supply the resulting reference and the intended planetary clock settings.

Applications can translate these definitions into a provider's tool format or an MCP/HTTP adapter. Check that host's supported schema vocabulary and map its response/error envelope explicitly. The package supplies contracts, a dispatcher and the JSON CLI below. Applications supply server integrations and AI connections.

## JSON CLI

Installing `thai-astrology` also installs the `thai-astrology` executable. It uses the same five tools and result contracts as the library, without extra runtime dependencies. From a project that has installed the package, run:

```bash
npx --no-install thai-astrology --help
npx --no-install thai-astrology --version
npx --no-install thai-astrology tools
npx --no-install thai-astrology schemas
npx --no-install thai-astrology schemas calculate_horoscope --pretty
```

`tools` returns `{ schemaVersion: "1.0", ok: true, data: ToolDefinition[] }`. `schemas` returns the same envelope with `data` containing the tool-name-to-schema map; adding a tool name selects its `{ inputSchema, outputSchema }` pair. `--version` returns an envelope whose `data.version` is the package version. `--help` (or `-h`) prints plain-text usage. Discovery and schema commands never read stdin.

`call <tool>` reads one complete UTF-8 JSON value from stdin. Use the tool's argument shape, including the `input` wrapper for horoscope and validation calls:

```bash
npx --no-install thai-astrology call calculate_horoscope <<'JSON'
{
  "input": {
    "date": { "year": 2024, "era": "CE", "month": 9, "day": 15 },
    "time": { "hour": 8, "minute": 30 },
    "location": { "province": "TH-50" }
  }
}
JSON
```

Save that JSON object as `birth.json` to read it from a file instead. `--input -` explicitly selects stdin. A file path can contain spaces when quoted.

```bash
npx --no-install thai-astrology call calculate_horoscope --input birth.json --pretty
```

Search arguments are directly `{ "countryCode": "TH", "query": "Chiang Mai" }`. Transit arguments contain both `{ "natal": HoroscopeInput, "transit": HoroscopeInput }`. No current date or time is inferred. Date, era, local time and reference conventions remain identical to the library. A selected validation call returns exit 0 even if its result contains `data.valid: false`.

Each invocation emits one JSON result to stdout, ending with a newline; `--pretty` adds indentation. Tool calls preserve the dispatcher's full result envelope. Failures also emit a short diagnostic to stderr, so callers should parse stdout separately from stderr. Empty input, a UTF-8 BOM, malformed JSON and multiple JSON documents are rejected. This CLI processes one call per process; it is not a JSON Lines server.

| Exit code | Meaning | Error code |
| --- | --- | --- |
| 0 | Command or tool completed | No transport error; inspect validation `data.valid` if relevant |
| 1 | Tool failed | `UNKNOWN_TOOL`, `INVALID_ARGUMENTS`, `INVALID_INPUT`, `CALCULATION_ERROR` |
| 2 | Command or input could not be read | `CLI_USAGE_ERROR`, `INPUT_READ_ERROR`, `INVALID_JSON` |
| 3 | Unexpected internal failure | `INTERNAL_ERROR`; output-stream failures report `OUTPUT_WRITE_ERROR` to stderr |

Malformed JSON diagnostics do not echo the source document. Unexpected exceptions produce a generic failure instead of a stack trace. Existing tool-domain errors retain their structured issue fields. A terminal invocation of `call` requires `--input <file>` or piped stdin, so it does not wait interactively for birth data.

Python can call the installed package directly through Node, without an AI SDK. Run this example from the project where the npm package is installed:

```python
import json
import subprocess

args = {"countryCode": "TH", "query": "Chiang Mai", "limit": 1}
completed = subprocess.run(
    ["node", "node_modules/thai-astrology/bin/thai-astrology.cjs", "call", "search_locations"],
    input=json.dumps(args), capture_output=True, text=True, encoding="utf-8",
)
result = json.loads(completed.stdout)
if completed.returncode == 0:
    print(result["data"]["items"])
else:
    print(result["error"]["code"], result["error"]["message"])
```

For a source checkout, first run `npm run build`, then use `node bin/thai-astrology.cjs` in place of `npx --no-install thai-astrology`. The CLI is independent of browser imports and does not open a network service.

## MCP adapter

The optional package under `adapters/mcp` exposes the same five tools to an MCP client through a local stdio process. It uses the official MCP TypeScript SDK. Its dependencies are separate from the core library, whose runtime dependencies and browser entry points are unchanged.

Use Node.js 20+ for the adapter (Node.js 24 for repository development). From the repository root:

```bash
npm ci
npm --prefix adapters/mcp ci
npm --prefix adapters/mcp test
npm --prefix adapters/mcp run test:package
```

The core build runs during `npm ci`; rebuild with `npm run build` after editing core source. The adapter is a private local package and depends on this checkout's `tools` and `schemas` entry points. No new release is published by these commands.

For an MCP application that uses `mcpServers` configuration, replace both absolute paths:

```json
{
  "mcpServers": {
    "thai-astrology": {
      "command": "/absolute/path/to/node",
      "args": ["/absolute/path/to/thai-astrology/adapters/mcp/bin/thai-astrology-mcp.cjs"]
    }
  }
}
```

Use a Node.js 20+ executable. Other clients can use the same command and arguments in their own configuration format. The client launches the process and performs initialization; the adapter accepts no command-line options. Stdout contains only MCP JSON-RPC messages, and diagnostics go to stderr. The transport is stdio and no HTTP port or AI provider connection is started.

Discovery returns the tool definitions, JSON input/output schemas and read-only annotations. A call returns the existing versioned envelope in `structuredContent`, with the same JSON serialized in a text content block. The output schema describes the envelope, including structured failures. `isError` is true for tool failures and false when validation successfully reports `data.valid: false`. Unknown tools produce MCP invalid-params errors. Birth data is not logged by the adapter; results go to the connected client.

The pinned SDK negotiates initialization-based MCP revisions. Tests cover `2025-06-18` and `2025-11-25` using the official SDK client, including output-schema validation. Clients must support that negotiation model. The adapter advertises only tools; HTTP transport, resources, prompts, model sampling and background tasks are outside its capabilities. See the official [lifecycle](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle) and [tool contract](https://modelcontextprotocol.io/specification/2025-11-25/server/tools).

See the [adapter README](../adapters/mcp/README.md) for setup and packaging details. Core library and JSON CLI usage remain available independently.

## Selected result sections

The calculation tools accept an optional `sections` array alongside the existing arguments. It applies equally to direct tool dispatch, JSON CLI input and MCP calls. Omit it to preserve the existing full result; the core calculation APIs always return their full results.

```ts
import { executeThaiAstrologyTool } from "thai-astrology/tools"

const result = executeThaiAstrologyTool("calculate_horoscope", {
  input: {
    date: { year: 2024, era: "CE", month: 9, day: 15 },
    time: { hour: 8, minute: 30 },
    location: { province: "TH-50" },
  },
  sections: ["points", "calendar"],
})
if (result.ok) console.log(result.data.points?.ascendant.signName)
```

Allowed names are `points`, `houses`, `charts`, `factors`, `calendar`, `taksa`, `relationships`, `timing` and `diagnostics`. The chart's `schemaVersion`, `profile` and normalized `input` are always returned, including resolved references and fallback reasons. `sections: []` returns only that metadata; repeated names are ignored. Unknown names and non-array selections produce `INVALID_ARGUMENTS`. Selected values are copied from the same full calculation, without rounding or recalculation, so selection reduces response size rather than calculation cost.

For `calculate_transits`, the same selection applies independently to both `natal` and `transit` charts. The complete `comparison` is always retained. Full domain validation and calculation still run, including when no data sections are selected. Failures preserve the usual error envelope.

TypeScript calls with a known argument object and no selection retain the full-result type. Selected calls, and unknown arguments that could contain a selection, return `SelectedHoroscope` or `SelectedHoroscopeTransits`, whose selectable fields are optional. These types and `HoroscopeSection` are exported from `thai-astrology/tools`. The output schemas accept both full and selected envelopes; they require the always-present metadata and describe optional selectable sections.

## Connect with Codex

After building the core and installing the adapter dependencies, register its stdio command with Codex. Replace the executable and script paths with absolute paths on your computer:

```bash
codex mcp add thai_astrology -- /absolute/path/to/node /absolute/path/to/thai-astrology/adapters/mcp/bin/thai-astrology-mcp.cjs
codex mcp get thai_astrology
```

Use Node.js 20+ for that command. Start a new Codex session to load the registered server. Ask it to search for a birthplace, validate an explicit civil input, then calculate the requested sections and explain the returned factors. The client needs a supported signed-in model independently of the MCP adapter. The library and adapter do not select or configure an AI model. See the [official Codex MCP documentation](https://developers.openai.com/codex/mcp).

## Birthplace resolution

Use `resolveHoroscopeBirthplace()` from the root library or the `resolve_birthplace` tool to prepare a selected birthplace for calculation. Both accept `BirthplaceResolutionInput` and return `ResolvedBirthplace`. Resolution supports civil Gregorian dates in CE 1900–2100, with explicit `era: "CE"` or `"BE"` and a required local hour/minute.

```ts
import { searchThaiAstrologyLocations, resolveHoroscopeBirthplace, calculateThaiHoroscope } from "thai-astrology"

const city = searchThaiAstrologyLocations({ countryCode: "US", query: "New York", limit: 1 }).items[0]
if (!city) throw new Error("Select another location or supply precise coordinates")
const resolved = resolveHoroscopeBirthplace({
  date: { year: 2024, era: "CE", month: 6, day: 21 },
  time: { hour: 8, minute: 30 },
  location: { locationId: city.id, countryCode: "US" },
})
console.log(resolved.civilTime.utcOffsetSeconds) // -14400 (EDT)
const chart = calculateThaiHoroscope(resolved.input)
console.log(chart.profile.referenceMode) // explicit
```

The tool accepts the same argument object directly, without an `input` wrapper. Pass the returned `data.input` unchanged into `validate_horoscope_input` or `calculate_horoscope`; resolve a separate input for each natal/transit date. Dates and local clock values are preserved rather than converted to UTC fields.

`location` accepts a catalog `locationId` and optional matching `countryCode`. It also accepts explicit `latitude`/`longitude`, with an explicit `timeZone` or `utcOffsetHours`. Edited coordinates never inherit a catalog timezone automatically. Catalog identity/labels, the selected coordinates and their `coordinateKind` are returned in `location`; labels identify the selected catalog record if coordinates were edited. A Thai provincial-seat selection retains its province code in the ready input; manual coordinate overrides use their explicit reference instead.

Defaults are sunrise rounded to the nearest minute and a planetary reference frame of +06:42:04 (24124 seconds east of UTC), matching the structured API's automatic Thai settings. Select `timePrecision: "continuous"` or provide `referenceUtcOffsetSeconds` to choose other settings. The ready input contains both `ascendantReference` and `planetaryTimeReference`, so the chart reports an explicit reference selection. A birthplace's civil UTC offset and the planetary reference frame are separate values. Classical rising durations and the library's other astrological conventions remain unchanged abroad.

When no manual offset is supplied, IANA rules from the runtime resolve the dated civil offset. `civilTime` reports `source: "iana"`, exact `utcOffsetSeconds`, `utcEpochMilliseconds`, `ambiguous` and the requested `disambiguation`. Save the ready input for reproducible calculations across runtime timezone-database updates.

The default `disambiguation: "reject"` returns `AMBIGUOUS_CIVIL_TIME` when a clock time occurs twice. Retry only after choosing `"earlier"` or `"later"`, or supplying a known UTC offset. For New York on 3 November 2024 at 01:30, earlier resolves to −14400 seconds and later to −18000. Nonexistent times, including New York on 10 March 2024 at 02:30, produce `INVALID_BIRTHPLACE`; they are not shifted into existence. Direct library calls throw `BirthplaceResolutionError` with the same `code` and field-level `issues`.

An explicit `location.utcOffsetHours` bypasses IANA, including when Intl support is unavailable. It requires whole-second precision and cannot be combined with `disambiguation`. This branch reports `source: "explicit-offset"` and `ambiguous: null`, without inferring an instant from a timezone. A returned timezone label is not consulted in this branch. Invalid civil dates and reference-frame settings retain `HoroscopeInputError`/`INVALID_INPUT` behavior. Structural tool errors use `INVALID_ARGUMENTS`.

Resolution validates references but does not guarantee that sunrise exists at the selected coordinates on that day. Calculation still handles no-sunrise dates through the usual failure result. Country-only selection and missing birth time are insufficient input.
