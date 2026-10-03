# Thai astrology API guide

[README](../README-en.md) · [ภาษาไทย](api.md)

This guide covers the data used to display charts and write interpretation rules. Start with `calculateThaiHoroscope()` and read the sections you need. Results are JSON-serializable; planet, sign, house and Rerk names are returned in Thai.

## Input and main APIs

```ts
import { calculateThaiHoroscope, type HoroscopeInput } from "thai-astrology"

const input: HoroscopeInput = {
  date: { year: 2567, era: "BE", month: 9, day: 15 },
  time: { hour: 8, minute: 30 },
  location: { province: "เชียงใหม่" },
}
const horoscope = calculateThaiHoroscope(input)

console.log(horoscope.points.sun.signName) // สิงห์ (Leo)
console.log(horoscope.calendar.thaiLunarDate?.label) // ข๑๓ด๑๐
```

| Input field | Type and constraints |
| --- | --- |
| `date.year`, `date.era` | Integer year; `"BE"` for Buddhist Era 544-10542 or `"CE"` for Common Era 1-9999 |
| `date.month`, `date.day` | Integer month 1-12 and a valid day in the Gregorian calendar |
| `time.hour`, `time.minute` | Integer local civil hour 0-23 and minute 0-59 |
| `location.province` | Optional Thai province name from `getThaiAstrologyProvinces()` |
| `location.localTimeCorrectionMinutes` | Optional finite minutes from -1440 to 1440; overrides the province correction |

Omitting both province and correction applies zero correction. Unknown province names require an explicit correction. The correction shifts the ascendant's 06:00 reference; it is not a timezone or UTC offset. Resolve timezone and DST conversions before supplying input.

| API | Result |
| --- | --- |
| `calculateThaiHoroscope(input)` | `ThaiHoroscope`: a structured natal horoscope, always using Suriyayatra |
| `calculateHoroscopeTransits(natalInput, transitInput)` | Natal and transit horoscopes with comparisons |
| `validateHoroscopeInput(input)` | `{ valid: true, value }` or `{ valid: false, issues }`, without throwing for invalid input |
| `getThaiAstrologyProvinces()` | All 77 provinces, each with `province` and `localTimeCorrectionMinutes` |
| `calculateDetailedPositions(input)` | Detailed Suriyayatra positions and related data; accepts `CalculationInput` |
| `generateThaiAstrologyChart(input)` | The earlier chart API; defaults to `legacy`, with optional `method: "suriyayatra"` |

The earlier input shape uses `day`, `monthTh`, `hour`, `minute`, `province` and one year field: `yearBe` is Buddhist Era; `yearBc` is **Common Era**, despite its name. For example, `yearBe: 2567` equals `yearBc: 2024`.

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
