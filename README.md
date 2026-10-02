# Thai Astrology

[English](README.md) | [ภาษาไทย](README-th.md)

Thai Astrology (โหราศาสตร์ไทย) is a TypeScript library for classical Thai astrological calculations. It converts birth details into planetary positions, a 12-channel chart, lakna, and Tanuseth without runtime dependencies. Node.js 16 or later is supported, with TypeScript declarations included.

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
  yearBe: 2566, // Buddhist Era; equivalent to 2023 CE
  hour: 14,
  minute: 45,
  province: "กรุงเทพมหานคร", // Bangkok
})

console.log(formatChannelOutputs(chart))
console.log(formatChannelOutputs(chart, "thai"))
console.log(formatChannelOutputs(chart, "arabic"))
console.log(chart.sunPosition)
```

Use `yearBe` for the Buddhist Era year. The legacy field `yearBc` accepts a Gregorian year: `yearBc: 2023` is equivalent to `yearBe: 2566`. Supply one year field.

CommonJS consumers can use the same API:

```js
const { generateThaiAstrologyChart, formatChannelOutputs } = require("thai-astrology")
```

Example output:

```text
[ '58', '0',  '9',  '6', '14', '23', '',   '', 'ลั',  '',   '7*', '' ]

[ '๕๘', '๐',  '๙',  '๖', '๑๔', '๒๓', '',   '', 'ลั',  '',   '๗*', '' ]

[ '58', '0',  '9',  '6', '14', '23', '',   '', 'ลั',  '',   '7*', '' ]

[ 27, 29 ]
```

## Key API

- `generateThaiAstrologyChart(input: CalculationInput): ThaiAstrologyChart` – returns planetary positions, Tanuseth, 12 channel outputs, and ruling planets metadata when available. When ruling planets cannot be determined, the chart includes `rulingPlanetsError`.
- `formatChannelOutputs(chart, options?: { numerals?: "arabic" | "thai" } | "arabic" | "thai")` – strips channel labels and renders numbers in Arabic or Thai numerals.

## Development

```bash
nvm use
npm ci
npm run check
```

Node.js 24 is the development default. The package retains its Node.js 16 minimum, and CI checks Node.js 16, 22, and 24.

```text
src/
  index.ts                    Public API
  engine/
    astro-calculation.ts      Calculation engine
    astro/ruling-planets.ts   Ruling planet helpers
test/
  run.cjs                     Compatibility tests
  fixtures/                   Expected npm 0.1.7 chart results
scripts/                      Build cleanup and package verification
.github/workflows/            CI checks
dist/                         Generated JavaScript and declarations
```

Edit `src/`; `dist/` is rebuilt automatically and ignored by Git. VS Code hides `dist/` and `node_modules/` in the Explorer to keep source files easy to find. The npm archive includes `dist/`, TypeScript source for declaration maps, README, license, and package metadata.

`npm run check` typechecks the source, tests release compatibility, packs the library, and verifies an installed archive with CommonJS, ESM imports, and TypeScript consumers. See [CONTRIBUTING.md](CONTRIBUTING.md) for commands and release steps.

## License

MIT © Contributors
