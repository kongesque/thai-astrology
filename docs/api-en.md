# Thai astrology API guide

[README](../README-en.md) · [ภาษาไทย](api.md)

This guide covers the data used to display charts and write interpretation rules. Start with `calculateThaiHoroscope()` and read the sections you need. Results are JSON-serializable; planet, sign, house and Rerk names are returned in Thai.

## Input and main APIs

For natal charts, use the birth date and local civil time, resolve the dated UTC offset, and supply both the planetary clock (`planetaryTimeReference`) and coordinate sunrise (`ascendantReference`). An app can fill coordinates from a province/city and resolve the offset; users do not need to enter the planetary reference offset themselves.

The example declares the IANA-derived Bangkok +06:42:04 planetary frame in application code; it is not prescribed for every school. Both fields must be supplied explicitly: the API does not enable them when omitted. See [traditional calculations](#traditional-calculations) for existing calls.

```ts
import { calculateThaiHoroscope, createSunriseReference, resolveCivilTimeOffset } from "thai-astrology"
import type { HoroscopeInput } from "thai-astrology"

const civilTime = { yearCe: 2024, month: 9, day: 15, hour: 8, minute: 30 }
const { utcOffsetHours } = resolveCivilTimeOffset(civilTime, "Asia/Bangkok")
const ascendantReference = createSunriseReference({ province: "เชียงใหม่", utcOffsetHours })
const planetaryTimeReference = {
  civilUtcOffsetSeconds: Math.round(utcOffsetHours * 3600),
  referenceUtcOffsetSeconds: 6 * 3600 + 42 * 60 + 4,
}

const input: HoroscopeInput = {
  date: { year: civilTime.yearCe, era: "CE", month: civilTime.month, day: civilTime.day },
  time: { hour: civilTime.hour, minute: civilTime.minute },
  ascendantReference,
  planetaryTimeReference,
}
const horoscope = calculateThaiHoroscope(input)

console.log(horoscope.points.sun.signName) // สิงห์
console.log(horoscope.calendar.thaiLunarDate?.label) // ข๑๓ด๑๐
```

| Input field | Type and constraints |
| --- | --- |
| `date.year`, `date.era` | Integer year; `"BE"` for Buddhist Era 544-10542 or `"CE"` for Common Era 1-9999 |
| `date.month`, `date.day` | Integer month 1-12 and a valid day in the Gregorian calendar |
| `time.hour`, `time.minute` | Integer local civil hour 0-23 and minute 0-59 |
| `location.province` | Optional Thai province name from `getThaiAstrologyProvinces()` |
| `location.localTimeCorrectionMinutes` | Optional finite minutes from -1440 to 1440; overrides the province correction |
| `planetaryTimeReference` | Optional integer `civilUtcOffsetSeconds` and `referenceUtcOffsetSeconds`, each within ±50,400 |
| `ascendantReference` | Optional `method: "sunrise"`, latitude (-90..90), longitude (-180..180) and `utcOffsetHours` (-14..14) including DST |

For the default reference, omitting both province and correction applies zero correction. Unknown province names require an explicit correction. The correction shifts the ascendant's 06:00 reference; it is not a timezone or UTC offset. Resolve timezone and DST conversions before supplying input.

| API | Result |
| --- | --- |
| `calculateThaiHoroscope(input)` | `ThaiHoroscope`: a structured natal horoscope, always using Suriyayatra |
| `calculateHoroscopeTransits(natalInput, transitInput)` | Natal and transit horoscopes with comparisons |
| `validateHoroscopeInput(input)` | `{ valid: true, value }` or `{ valid: false, issues }`, without throwing for invalid input |
| `getThaiAstrologyProvinces()` | All 77 provinces, each with `province` and `localTimeCorrectionMinutes` |
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

## Traditional calculations

Omit `planetaryTimeReference` and `ascendantReference` to retain the civil-local planetary clock and the 06:00 ascendant reference with province correction. The API accepts this shape for existing calls. Both approaches use the current lunar calendar. This selects calculation conventions, not a library version.

## Coordinate-based sunrise

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

Optional `ascendantReference` requires `method: "sunrise"`, latitude (-90..90), longitude (-180..180) and civil `utcOffsetHours` (-14..14), including DST. `calculateSunrise()` accepts `yearCe`, `month`, `day` and the same coordinates/offset. Both support CE 1900–2100 in Thailand or abroad. The NOAA/Meeus model uses a sea-level solar-center altitude of −50′, without terrain, elevation or actual weather corrections. Coordinates do not determine the civil timezone; no timezone/DST lookup is performed.

For `status: "rise"`, `timeMinutes` is unrounded and in [0, 1440); `roundedTimeMinutes` is for display or explicit minute precision and may be 1440 (24:00). `altitudeResidualDegrees` is a numerical residual, not physical accuracy. An absent event returns `status: "no-rise"`; a horoscope selecting sunrise on such a date throws `RangeError`. Omit `ascendantReference` to use the traditional reference.

`timePrecision: "minute"` uses nearest-minute sunrise for the ascendant and all twelve sign-start times. Omitted precision or `"continuous"` uses raw sunrise and preserves existing results. Both location helpers accept the field. Raw events, planets and lunar dates do not change. A rounded 24:00 becomes 00:00 within the ascendant cycle without moving the civil date.

The province correction is zero. A simultaneous nonzero `localTimeCorrectionMinutes` is rejected. The option is also available on `CalculationInput`; the chart wrapper requires `method: "suriyayatra"`.

`ascendantReference` changes the ascendant reference. Rising durations remain fixed and the Sun is held at its birth-time position. Without `planetaryTimeReference`, planetary positions retain the civil-local clock; the sunrise offset alone does not shift planetary calculations. This is not a worldwide geometric ascendant or modern planetary ephemeris.

## Province and country selection

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

```ts
import { calculateThaiHoroscope, createSunriseReference } from "thai-astrology"

// New York uses EDT (UTC−4) on this date; the country label is optional.
const foreign = createSunriseReference({
  countryCode: "US", latitude: 40.7128, longitude: -74.006, utcOffsetHours: -4,
})
const foreignChart = calculateThaiHoroscope({
  date: { year: 2024, era: "CE", month: 6, day: 21 },
  time: { hour: 8, minute: 30 },
  ascendantReference: foreign,
  planetaryTimeReference: {
    civilUtcOffsetSeconds: Math.round(foreign.utcOffsetHours * 3600),
    referenceUtcOffsetSeconds: 6 * 3600 + 42 * 60 + 4,
  },
})
console.log(foreignChart.timing.sunrise?.roundedTimeMinutes) // 325 = 05:25
```

`getThaiAstrologyProvinceLocations()` returns fresh records with `province`, `countryCode: "TH"`, `latitude`, `longitude`, `timeZone: "Asia/Bangkok"`, `coordinateKind: "province-seat"` and a public `geonameId` for inspecting the point. WGS84 coordinates represent provincial seats, rather than boundaries or every birthplace in a province. `timeZone` is metadata; no offset lookup is performed. The existing `getThaiAstrologyProvinces()` retains its traditional correction records.

`createSunriseReference()` requires a province or both coordinates, plus explicit `utcOffsetHours`. Both supplied coordinates override the seat; one coordinate cannot be mixed with a provincial default. Pass the result into a natal/transit chart's `ascendantReference`. Each chart's own date determines a fresh sunrise event; no fixed sunrise time is stored by province.

`getThaiAstrologyCountries()` returns English names and two-letter codes for 250 countries/territories, including GeoNames `XK` and excluding dissolved `AN`/`CS`. An optional `countryCode` must use an uppercase code from this list. A country alone is insufficient: supply coordinates and the date's civil offset, including DST. The helper does not check borders or infer timezones. A foreign country cannot be combined with a Thai province. When switching countries in a form, clear the previous province and coordinates before accepting the new location.

Location data is adapted from [GeoNames](https://www.geonames.org/), retrieved 4 October 2026, under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). It is reduced to selector fields and aligned with existing library province names. See [sources and licensing](../SOURCES.md).

## Country-scoped location search and offsets

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

`searchThaiAstrologyLocations({ countryCode, query?, limit?, offset? })` requires a code from `getThaiAstrologyCountries()` and searches English city names or Thai province names. Matching ignores case and Latin diacritics. It returns `{ items, total }`, where `total` is before pagination. `limit` defaults to 50 and is capped at 100; `offset` is a nonnegative integer. Each record has `id`, `countryCode`, `nameEnglish`, coordinates, `timeZone`, `coordinateKind` and `geonameId`; Thai seats also have `nameThai` and `province`. Results are fresh copies in stable snapshot order.

The starter catalog includes capitals, the ten largest source cities per country, a largest available source city per timezone and all 77 Thai provincial seats: 1,945 points in 243 countries/territories. It is not every city or every worldwide timezone. Countries without catalog records return `items: []`, without substituting another country's location. Manual coordinates remain supported. GeoNames CC BY 4.0 data is reduced without changing its coordinates or timezone names.

`createSunriseReferenceForLocation()` accepts a result's `locationId` or both coordinates. Optional `countryCode` must agree with the selected ID. Explicit `utcOffsetHours` takes precedence and bypasses `Intl`. Otherwise, supply `civilTime: { yearCe, month, day, hour, minute }`; the selected place's zone, or an explicit `timeZone`, resolves the offset at that birth date/time. CE 1900–2100 is supported.

Both coordinates can override a selected point. Automatic mode then requires an explicitly confirmed `timeZone`, or provide a numeric offset instead. The helper does not infer a timezone from edited coordinates, which might cross a boundary. When switching countries in a form, clear the previous place, coordinates and timezone before selecting new values.

`resolveCivilTimeOffset(civilTime, timeZone, disambiguation?)` returns `timeZone`, `utcOffsetHours`, `utcEpochMilliseconds` and `ambiguous`. It uses runtime IANA rules through `Intl.DateTimeFormat`, without reading the host timezone or current clock. Default `disambiguation: "reject"` refuses repeated times; explicitly choose `"earlier"` or `"later"` when appropriate. Nonexistent times during forward clock changes or skipped dates are always rejected, rather than shifting a birth time.

This is an input adapter. The existing calculation core still receives numeric offsets and retains deterministic results for identical inputs. Intl rules can differ by runtime/database version. For repeatable calculations, retain the resolved numeric offset and runtime version or supply a verified offset explicitly. Unsupported timezone names require a supported runtime or explicit offset.

Automatic offsets apply at the entered civil time. The existing sunrise model holds that offset for the whole day. On an intraday DST transition, displayed sunrise uses the selected offset frame; this does not yet model a civil clock that changes during the event day. The adapter adds no geometric worldwide ascendant or planetary frame conversion by itself. Select the separate planetary clock option below when needed.

## Planetary clock reference

Select `planetaryTimeReference` in `calculateThaiHoroscope`, `calculateDetailedPositions` or the chart wrapper with `method: "suriyayatra"`. Natal and transit inputs choose independently. Legacy refuses the option.

```ts
import { calculateThaiHoroscope, resolveCivilTimeOffset } from "thai-astrology"

const civil = { yearCe: 2024, month: 1, day: 1, hour: 0, minute: 0 }
const offset = resolveCivilTimeOffset(civil, "Asia/Bangkok")
const chart = calculateThaiHoroscope({
  date: { year: civil.yearCe, era: "CE", month: civil.month, day: civil.day },
  time: { hour: civil.hour, minute: civil.minute },
  planetaryTimeReference: {
    civilUtcOffsetSeconds: Math.round(offset.utcOffsetHours * 3600),
    referenceUtcOffsetSeconds: 6 * 3600 + 42 * 60 + 4,
  },
})
console.log(chart.diagnostics.planetaryTime?.dayOffset) // -1
console.log(chart.diagnostics.planetaryTime?.secondOfDay) // 85324
```

Both offsets must be integer seconds within -50,400..50,400. Civil includes birth-time DST; the reference frame is caller-selected. The formula is `reference time = civil time − civil offset + reference offset`, with day carry across years/leap days. A reference date outside CE 1–9999 is refused. Seconds are retained; 23:59 is not changed to 24:00.

The +06:42:04 example comes from IANA civil-clock data; it is not certified as every Suriyayatra formula's meridian. Country/coordinates do not choose the planetary frame. Abroad, resolve the birthplace's dated offset and use a separately justified reference frame. `Math.round` above recovers IANA's whole-second offset from its hours representation; it does not tune a planetary longitude.

Omitting the option preserves results. Equal offsets also preserve calculations, adding diagnostics only. With different frames, solar/lunar/Ketu intraday stages evaluate integral-second fractions before division. Civil dates, `calendar.chulaSakarat`, Thai lunar dates and Taksa remain civil; geometric lunar phase follows the changed Sun/Moon. Ascendant time and sunrise remain in the civil frame, although its new Sun position can change the ascendant/houses. When combining sunrise, both options must use the same civil offset.

Optional `diagnostics.planetaryTime` contains reference `horakhun`, `secondOfDay`, `dayOffset` and both offsets. The planetary epoch's Chula Sakarat uses the chosen frame, while calendar Chula Sakarat stays civil. This is fixed-offset frame conversion, not UT1/TT conversion or leap-second modeling.

Mean Sun uses the reduced day base plus intraday units. `diagnostics.solarCycleUnits` retains the wrapped sum for the epoch-year decision; do not directly convert that diagnostic into mean Sun near an annual crossing.

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

`calculateHoroscopeTransits(natalInput, transitInput)` accepts two inputs of the same shape and returns `natal`, `transit` and `comparison`. Both dates and times must be supplied explicitly.

| Field | Meaning |
| --- | --- |
| `transit.points[key]` | Transit position at the supplied time; `house` is relative to the transit ascendant |
| `comparison[key].natalHouse` | Transit planet's house relative to the natal ascendant, 1-12 |
| `comparison[key].longitudeDifferenceDegrees` | Shortest signed difference between transit and natal longitude for the same planet, from -180 to less than 180 degrees |

`comparison` contains planet keys only, excluding the ascendant. Longitude difference is not accumulated orbital motion, instantaneous speed or retrograde status.

## Validation and full types

`validateHoroscopeInput()` accepts `unknown` without coercing strings to numbers. Invalid results include `issues` with `field`, `code` (`required`, `type`, `range`, `unknown`) and `message`. On success, `value` is normalized data containing both `yearBe` and `yearCe`; it is not the input shape to pass back to the calculation API.

`calculateThaiHoroscope()` and `calculateHoroscopeTransits()` throw `HoroscopeInputError` for invalid input; read details from `error.issues`. Full types, including `profile`, `timing` and `diagnostics`, are in [horoscope.ts](../src/horoscope.ts), [DetailedPosition](../src/engine/astro/suriyayatra.ts) and [CalculationInput](../src/engine/astro-calculation.ts).

Read the [calculation rules and limitations](../README-en.md#calculation-rules-and-limitations) before using the results.
