'use strict'

const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { dirname, join, resolve, sep } = require('node:path')
const { createContext, Script } = require('node:vm')

const root = resolve(__dirname, '..')
const temp = mkdtempSync(join(tmpdir(), 'thai-astrology-package-'))
const npmCli = process.env.npm_execpath
assert.ok(npmCli, 'Run this check through npm run test:package')

const npm = (args, cwd) => execFileSync(process.execPath, [npmCli, ...args], {
  cwd,
  encoding: 'utf8',
  env: { ...process.env, npm_config_cache: join(temp, 'cache') },
})

try {
  // Exercise prepare so the archive always contains a fresh build.
  const [packed] = JSON.parse(npm(['pack', '--json', '--pack-destination', temp], root))
  const paths = packed.files.map(({ path }) => path)
  for (const required of ['dist/index.js', 'dist/index.d.ts', 'src/index.ts', 'README.md', 'README-en.md', 'assets/rasi-chart.svg', 'LICENSE']) {
    assert.ok(paths.includes(required), `Archive is missing ${required}`)
  }
  assert.ok(paths.every(path => /^(dist\/|src\/|assets\/rasi-chart\.svg$|package\.json$|README(?:-en)?\.md$|LICENSE$)/.test(path)), 'Unexpected development files in archive')
  assert.ok(paths.every(path => !path.endsWith('.tsbuildinfo')), 'Build cache must not be published')

  const consumer = join(temp, 'consumer')
  mkdirSync(join(consumer, 'test', 'fixtures'), { recursive: true })
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ private: true }))
  npm(['install', join(temp, packed.filename), '--ignore-scripts', '--no-audit', '--no-fund', '--offline'], consumer)
  const installed = join(consumer, 'node_modules', 'thai-astrology')
  for (const readme of ['README.md', 'README-en.md']) {
    const text = readFileSync(join(installed, readme), 'utf8')
    for (const [, image] of text.matchAll(/(?:!\[[^\]]*\]\(|<img\s+src=")(assets\/[^)"]+)(?:\)|")/g)) {
      assert.ok(existsSync(join(installed, image)), `README image is missing: ${readme} -> ${image}`)
    }
  }
  for (const path of paths.filter(path => path.endsWith('.map'))) {
    const map = JSON.parse(readFileSync(join(installed, path), 'utf8'))
    for (const source of map.sources) {
      assert.ok(existsSync(resolve(installed, path, '..', map.sourceRoot || '', source)), `Source map target is missing: ${path} -> ${source}`)
    }
  }
  copyFileSync(join(root, 'test/run.cjs'), join(consumer, 'test/run.cjs'))
  copyFileSync(join(root, 'test/calculation.cjs'), join(consumer, 'test/calculation.cjs'))
  copyFileSync(join(root, 'test/horoscope.cjs'), join(consumer, 'test/horoscope.cjs'))
  copyFileSync(join(root, 'test/sunrise.cjs'), join(consumer, 'test/sunrise.cjs'))
  copyFileSync(join(root, 'test/locations.cjs'), join(consumer, 'test/locations.cjs'))
  copyFileSync(join(root, 'test/fixtures/sunrise-events.json'), join(consumer, 'test/fixtures/sunrise-events.json'))
  copyFileSync(join(root, 'test/fixtures/release-0.1.7.json'), join(consumer, 'test/fixtures/release-0.1.7.json'))
  execFileSync(process.execPath, ['test/run.cjs'], { cwd: consumer, stdio: 'inherit' })
  require('./local-validation.cjs').runLocalValidation(installed, 'installed')

  writeFileSync(join(consumer, 'esm.mjs'), `
import assert from 'node:assert/strict'
import { generateThaiAstrologyChart, formatChannelOutputs, calculateSun, calculateDetailedPositions, calculateTransits, describeLongitude, calculateThaiHoroscope, calculateHoroscopeTransits, validateHoroscopeInput, getThaiAstrologyProvinces, HoroscopeInputError, calculateSunrise, createSunriseReference, getThaiAstrologyProvinceLocations, getThaiAstrologyCountries } from 'thai-astrology'
const chart = generateThaiAstrologyChart({ day: 15, monthTh: 9, yearBe: 2566, hour: 14, minute: 45, province: 'กรุงเทพมหานคร' })
assert.deepEqual(chart.sunPosition, [27, 29])
assert.equal(formatChannelOutputs(chart)[8], 'ลั')
assert.equal(calculateSun(9, 2566, 15, 14, 45), chart.positions.sun)
const details = calculateDetailedPositions({ day: 15, monthTh: 9, yearBe: 2567, hour: 8, minute: 30, province: 'เชียงใหม่' })
assert.ok(details.longitudes.mercury.longitudeArcMinutes >= 0 && details.longitudes.mercury.longitudeArcMinutes < 21600)
assert.equal(describeLongitude(61).sign, 0)
const webInput = { date: { year: 2567, era: 'BE', month: 9, day: 15 }, time: { hour: 8, minute: 30 }, location: { province: 'เชียงใหม่' } }
assert.equal(calculateThaiHoroscope(webInput).points.mercury.longitudeArcMinutes, details.longitudes.mercury.longitudeArcMinutes)
assert.equal(calculateHoroscopeTransits(webInput, webInput).comparison.sun.longitudeDifferenceDegrees, 0)
assert.equal(validateHoroscopeInput(webInput).valid, true)
assert.equal(getThaiAstrologyProvinces().length, 77)
assert.throws(() => calculateThaiHoroscope({}), HoroscopeInputError)
assert.equal(calculateTransits({ day: 15, monthTh: 9, yearBe: 2567, hour: 8, minute: 30, province: 'เชียงใหม่' }, { day: 15, monthTh: 9, yearBe: 2567, hour: 8, minute: 30, province: 'เชียงใหม่' }).comparison.sun.longitudeDifferenceDegrees, 0)
const sunrise = calculateSunrise({ yearCe: 2024, month: 6, day: 21, latitude: 13.7563, longitude: 100.5018, utcOffsetHours: 7 })
assert.equal(sunrise.status, 'rise')
assert.equal(sunrise.roundedTimeMinutes, 352)
assert.equal(getThaiAstrologyProvinceLocations().length, 77)
assert.equal(getThaiAstrologyCountries().length, 250)
const provincial = createSunriseReference({ province: 'กรุงเทพมหานคร', utcOffsetHours: 7 })
assert.equal(calculateSunrise({ yearCe: 2024, month: 6, day: 21, ...provincial }).roundedTimeMinutes, 352)
`)
  execFileSync(process.execPath, ['esm.mjs'], { cwd: consumer, stdio: 'inherit' })

  // Execute the installed modules without Node globals or built-in module imports.
  // This verifies the runtime needed by browser bundlers, independently of the Node consumer.
  const context = createContext({ Date: class { constructor() { throw new Error('Civil calculations must not depend on host Date') } } })
  const moduleCache = new Map()
  const loadBrowserModule = file => {
    if (moduleCache.has(file)) return moduleCache.get(file).exports
    const module = { exports: {} }
    moduleCache.set(file, module)
    const localRequire = request => {
      assert.ok(request.startsWith('.'), `Browser runtime imports a Node/external module: ${request}`)
      const target = resolve(dirname(file), request.endsWith('.js') ? request : request + '.js')
      assert.ok(target.startsWith(join(installed, 'dist') + sep), 'Runtime import leaves compiled package')
      return loadBrowserModule(target)
    }
    const wrapper = new Script('(function(exports, require, module) {\n' + readFileSync(file, 'utf8') + '\n})', { filename: file }).runInContext(context)
    wrapper(module.exports, localRequire, module)
    return module.exports
  }
  const browserApi = loadBrowserModule(join(installed, 'dist/index.js'))
  const browserInput = { date: { year: 2567, era: 'BE', month: 9, day: 15 }, time: { hour: 8, minute: 30 }, location: { province: 'เชียงใหม่' } }
  const browserChart = JSON.parse(JSON.stringify(browserApi.calculateThaiHoroscope(browserInput)))
  const nodeChart = require(installed).calculateThaiHoroscope(browserInput)
  assert.deepEqual(browserChart, nodeChart)
  assert.equal(browserApi.calculateHoroscopeTransits(browserInput, browserInput).comparison.sun.longitudeDifferenceDegrees, 0)
  assert.equal(browserApi.validateHoroscopeInput(browserInput).valid, true)
  const coordinateInput = { ...browserInput, ascendantReference: { method: 'sunrise', latitude: 13.7563, longitude: 100.5018, utcOffsetHours: 7 } }
  assert.deepEqual(JSON.parse(JSON.stringify(browserApi.calculateThaiHoroscope(coordinateInput))), require(installed).calculateThaiHoroscope(coordinateInput))
  assert.equal(browserApi.calculateSunrise({ yearCe: 2024, month: 6, day: 21, latitude: 13.7563, longitude: 100.5018, utcOffsetHours: 7 }).roundedTimeMinutes, 352)
  assert.deepEqual(JSON.parse(JSON.stringify(browserApi.getThaiAstrologyProvinceLocations())), require(installed).getThaiAstrologyProvinceLocations())
  assert.deepEqual(JSON.parse(JSON.stringify(browserApi.getThaiAstrologyCountries())), require(installed).getThaiAstrologyCountries())
  const provincialReference = browserApi.createSunriseReference({ province: 'กรุงเทพมหานคร', utcOffsetHours: 7 })
  assert.deepEqual(JSON.parse(JSON.stringify(browserApi.calculateThaiHoroscope({ ...browserInput, ascendantReference: provincialReference }))), require(installed).calculateThaiHoroscope({ ...browserInput, ascendantReference: provincialReference }))

  const types = `
import { generateThaiAstrologyChart, formatChannelOutputs, calculateDetailedPositions, calculateTransits, calculateThaiHoroscope, calculateHoroscopeTransits, validateHoroscopeInput, calculateSunrise, createSunriseReference, getThaiAstrologyProvinceLocations, getThaiAstrologyCountries } from 'thai-astrology'
import type { CalculationInput, ThaiAstrologyChart, DetailedCalculationResult, DetailedThaiAstrologyChart, ThaiLunarDate, TransitCalculationResult, HoroscopeInput, ThaiHoroscope, HoroscopeTransitResult, SunriseReference, SunriseResult, ThaiProvinceLocation, AstrologyCountry, SunriseReferenceSelection } from 'thai-astrology'
const input: CalculationInput = { day: 15, monthTh: 9, yearBe: 2566, hour: 14, minute: 45, province: 'กรุงเทพมหานคร' }
const chart: ThaiAstrologyChart = generateThaiAstrologyChart(input)
const channels: string[] = formatChannelOutputs(chart, { numerals: 'thai' })
void channels
const detailed: DetailedCalculationResult = calculateDetailedPositions(input)
const richer: DetailedThaiAstrologyChart = generateThaiAstrologyChart({ ...input, method: 'suriyayatra' })
const lunarDate: ThaiLunarDate | null = richer.calendar.thaiLunarDate
const transits: TransitCalculationResult = calculateTransits(input, input)
void [detailed, lunarDate, transits]
const webInput: HoroscopeInput = { date: { year: 2567, era: 'BE', month: 9, day: 15 }, time: { hour: 8, minute: 30 } }
const webChart: ThaiHoroscope = calculateThaiHoroscope(webInput)
const webTransit: HoroscopeTransitResult = calculateHoroscopeTransits(webInput, webInput)
const validation = validateHoroscopeInput(webInput)
if (validation.valid) { const ceYear: number = validation.value.date.yearCe; void ceYear }
else { const field: string = validation.issues[0].field; void field }
void [webChart, webTransit]
const coordinateReference: SunriseReference = { method: 'sunrise', latitude: 13.7563, longitude: 100.5018, utcOffsetHours: 7 }
const sunrise: SunriseResult = calculateSunrise({ yearCe: 2024, month: 6, day: 21, ...coordinateReference })
if (sunrise.status === 'rise') { const minutes: number = sunrise.timeMinutes; void minutes }
const seasonal = calculateThaiHoroscope({ ...webInput, ascendantReference: coordinateReference })
const coordinateDetailed = calculateDetailedPositions({ ...input, ascendantReference: coordinateReference })
void [seasonal, coordinateDetailed]
const seats: ThaiProvinceLocation[] = getThaiAstrologyProvinceLocations()
const countries: AstrologyCountry[] = getThaiAstrologyCountries()
const selection: SunriseReferenceSelection = { province: 'กรุงเทพมหานคร', utcOffsetHours: 7 }
const selectedReference: SunriseReference = createSunriseReference(selection)
const selectedChart: ThaiHoroscope = calculateThaiHoroscope({ ...webInput, ascendantReference: selectedReference })
void [seats, countries, selectedChart]
`
  writeFileSync(join(consumer, 'types.cts'), types)
  writeFileSync(join(consumer, 'types.mts'), types)
  execFileSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'),
    '--noEmit', '--strict', '--module', 'NodeNext', '--moduleResolution', 'NodeNext',
    '--target', 'ES2019', 'types.cts', 'types.mts'], { cwd: consumer, stdio: 'inherit' })
  console.log(`Package verified: ${paths.length} files; CommonJS, ESM imports, TypeScript consumers, and browser runtime pass`)
} finally {
  rmSync(temp, { recursive: true, force: true })
}
