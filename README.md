# Thai Astrology

Thai Astrology (โหราศาสตร์ไทย) is a TypeScript library that implements classical Thai astrological calculations. It converts birth details into the 12-channel chart lakna, Tanuseth, planetary positions without relying on runtime dependencies.

## Install

```bash
npm install thai-astrology
```

## Usage

```ts
import {
  formatChannelOutputs,
  generateThaiAstrologyChart,
} from "thai-astrology"

const chart = generateThaiAstrologyChart({
  day: 15,
  monthTh: 9,
  yearBe: 2566, // 2023 in BCE 
  hour: 14,
  minute: 45,
  province: "กรุงเทพมหานคร", // Bangkok
})

console.log(formatChannelOutputs(chart))
console.log(formatChannelOutputs(chart, "thai"))
console.log(formatChannelOutputs(chart, "arabic"))
console.log(chart.sunPosition) 
```

For BCE dates, supply `yearBc` instead of `yearBe`. 

Example output:

```text
[ '58', '0',  '9',  '6', '14', '23', '',   '', 'ลั',  '',   '7*', '' ]

[ '๕๘', '๐',  '๙',  '๖', '๑๔', '๒๓', '',   '', 'ลั',  '',   '๗*', '' ]

[ '58', '0',  '9',  '6', '14', '23', '',   '', 'ลั',  '',   '7*', '' ]

[ 27, 29 ]
```

## Key API

- `generateThaiAstrologyChart(input: CalculationInput): ThaiAstrologyChart` – runs the core calculations and returns planets, tanuseth,12 channel outputs, and ruling planets metadata when available.
- `formatChannelOutputs(chart, options?: { numerals?: "arabic" | "thai" } | "arabic" | "thai")` – strips channel labels and renders numbers in Arabic or Thai numerals.

## License

MIT © Contributors
