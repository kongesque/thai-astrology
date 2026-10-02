# Thai Astrology: Thai astrology calculation engine

[ภาษาไทย](README.md) · [npm](https://www.npmjs.com/package/thai-astrology) · [MIT](LICENSE)

`thai-astrology` is a **Thai astrology calculation library** for JavaScript and TypeScript. It uses classical Suriyayatra (สุริยยาตร์) calculations to determine planetary positions, the ascendant and horoscope factors.

Use it as the calculation engine for natal charts, planetary transits and data used in horoscope interpretation. Supply a civil date, local time and Thai province, then access the results through its API. Calculation data is kept separate from interpretation rules and prediction text.

The project is open source under the MIT License. It supports Node.js 16+, includes TypeScript types, works with ESM and CommonJS, and has no runtime dependencies.

<p align="center">
  <img src="assets/rasi-chart.svg" alt="Example Suriyayatra Rasi chart, Sun in Aries at 10 degrees 42 minutes" width="720" />
</p>

Example API result: **21 April 1782 CE (2325 BE), 06:54 local time, Bangkok**. The center shows the natal Sun's degrees within its sign. Thai numerals identify planets in each sign; `ลั` marks the ascendant and `*` marks Tanuseth. This illustrates engine output outside the 1900–2100 CE interval used for sample comparisons; it does not establish historical accuracy.

## Getting started

```bash
npm install thai-astrology
```

Call `calculateThaiHoroscope` with a date, local time and province to calculate the chart above:

```ts
import { calculateThaiHoroscope } from "thai-astrology"

const horoscope = calculateThaiHoroscope({
  date: { year: 2325, era: "BE", month: 4, day: 21 },
  time: { hour: 6, minute: 54 },
  location: { province: "กรุงเทพมหานคร" },
})

console.log(horoscope.points.sun.degrees, horoscope.points.sun.minutes) // 10 42
console.log(horoscope.points.ascendant.signName) // เมษ
console.log(horoscope.charts.rasi.channels.thai[0]) // ลั๑*
```

Change `date`, `time` and `location` to calculate another horoscope. Read positions from `points` and the 12 Rasi channels from `charts.rasi.channels.thai`, ordered from Aries to Pisces. The center of the image uses `points.sun.degrees` and `points.sun.minutes`.

For CommonJS, use `require("thai-astrology")` instead of `import`.

### Required input

| Input | How to supply it |
| --- | --- |
| Date | `date` uses Gregorian months; set `era: "BE"` for Buddhist Era or `"CE"` for Common Era |
| Time | `time` is local civil time: hours 0..23, minutes 0..59 |
| Province (optional) | `location.province` uses Thai province names, available through `getThaiAstrologyProvinces()` |

BE 2567 equals CE 2024. Supply a real calendar date and numeric values. Omitting the location applies zero correction. Names, gender and contact details are not required for calculation.

### Important results

| Result section | Purpose |
| --- | --- |
| `points` | Planetary and ascendant positions; for example, `points.moon` |
| `houses` | All 12 houses, their rulers and occupants |
| `factors` | Ascendant ruler, Tanuseth and ascendant occupants |
| `charts` | Rasi, navamsa and drekkana positions and chart channels |
| `calendar` | Astrological weekday, geometric lunar phase and Thai lunar date |
| `taksa` | บริวาร, อายุ, เดช, ศรี, มูละ, อุตสาหะ, มนตรี and กาลกิณี |
| `relationships` | Sign conjunctions, oppositions, trines, squares and sextiles |

Zodiac indices start at Aries = 0; house numbers start at ตนุ = 1. Chart channels follow zodiac order, while `houses` start from the ascendant. Longitudes are provided in absolute degrees (`longitudeDegrees`) and arcminutes (`longitudeArcMinutes`). Channels use `ลั` for the ascendant and `*` for Tanuseth.

## What it calculates

- **Natal positions**: 10 planets and the ascendant, including zodiac signs, longitudes and houses.
- **Interpretation factors**: Tanuseth, ascendant ruler, house rulers, occupants, lunar mansions, ฤกษ์ and planetary dignities.
- **Chart data**: Rasi, navamsa and drekkana charts with Thai or Arabic numeral channels.
- **Planetary transits**: Positions at a specified date compared with natal houses and longitudes.
- **Taksa and calendar data**: Natal Taksa, horakhun, Chula Sakarat, geometric lunar phase and Thai lunar dates within the supported range.

Results are JSON-serializable. The same inputs produce the same calculation results.

## Main APIs

| API | Use it for |
| --- | --- |
| `calculateThaiHoroscope(input)` | A complete structured natal horoscope |
| `calculateHoroscopeTransits(natalInput, transitInput)` | Natal/transit horoscopes and comparisons from two explicit dates and times |
| `validateHoroscopeInput(input)` | Checking inputs before calculation; returns `valid` and `issues` on invalid input |
| `getThaiAstrologyProvinces()` | The 77 provinces and their local-time corrections |
| `calculateDetailedPositions(input)` | Detailed Suriyayatra results using the `CalculationInput` shape |

`calculateThaiHoroscope` and `calculateDetailedPositions` always use Suriyayatra. The earlier `generateThaiAstrologyChart` API defaults to `legacy`; select `method: "suriyayatra"` to use the same calculation method. In the earlier input shape, `yearBe` means Buddhist Era and `yearBc` means **Common Era**. Supply one year field.

`validateHoroscopeInput` reports invalid input without throwing. `calculateThaiHoroscope` throws `HoroscopeInputError` with `issues` when input is invalid.

## Limitations

- **A specific classical calculation system.** Results follow Suriyayatra and the configured rules. They can differ from engines using modern astronomical ephemerides, different ayanamshas or other astrological traditions.
- **Fixed rising durations and province corrections.** The ascendant calculation holds the Sun at its birth-time position. Coordinate-based sunrise and astronomical ascendants from latitude/longitude are not implemented. Sign-start times describe this method's schedule, not precise future ingress events.
- **Birth time is required; timezone/DST conversion is not automatic.** Province corrections are not UTC offsets. Prepare the correct local civil time before calculation.
- **Year coverage and precision are bounded.** Civil dates accept CE 1..9999. Thai lunar dates support BE 2125..2619 only; outside this range, `calendar.thaiLunarDate` is `null`. Planetary longitudes use integer arcminute precision; ascendant minutes may be fractional. Houses use the whole-sign system.
- **Taksa and lunar dates use explicit conventions.** Taksa changes day at 06:00 without substituting Rahu for Wednesday-night Mercury. Thai lunar dates change at midnight and are separate from geometric lunar phase. Thai Ketu follows its own 679-day cycle.
- **Transits compare positions.** Relationships are sign-based. Degree aspects with orbs, instantaneous speeds, retrograde status and ingress-time searches are not implemented. A longitude difference between two dates is not instantaneous speed.
- **Interpretation requires additional rules.** Results provide horoscope factors. The library does not generate finished predictions or guarantee their outcomes.

[MIT License](LICENSE)
