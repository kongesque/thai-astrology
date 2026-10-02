'use strict'

const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join, resolve } = require('node:path')

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
  for (const required of ['dist/index.js', 'dist/index.d.ts', 'src/index.ts', 'README.md', 'README-th.md', 'LICENSE']) {
    assert.ok(paths.includes(required), `Archive is missing ${required}`)
  }
  assert.ok(paths.every(path => /^(dist\/|src\/|package\.json$|README(?:-th)?\.md$|LICENSE$)/.test(path)), 'Unexpected development files in archive')
  assert.ok(paths.every(path => !path.endsWith('.tsbuildinfo')), 'Build cache must not be published')

  const consumer = join(temp, 'consumer')
  mkdirSync(join(consumer, 'test', 'fixtures'), { recursive: true })
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ private: true }))
  npm(['install', join(temp, packed.filename), '--ignore-scripts', '--no-audit', '--no-fund', '--offline'], consumer)
  const installed = join(consumer, 'node_modules', 'thai-astrology')
  for (const path of paths.filter(path => path.endsWith('.map'))) {
    const map = JSON.parse(readFileSync(join(installed, path), 'utf8'))
    for (const source of map.sources) {
      assert.ok(existsSync(resolve(installed, path, '..', map.sourceRoot || '', source)), `Source map target is missing: ${path} -> ${source}`)
    }
  }
  copyFileSync(join(root, 'test/run.cjs'), join(consumer, 'test/run.cjs'))
  copyFileSync(join(root, 'test/fixtures/release-0.1.7.json'), join(consumer, 'test/fixtures/release-0.1.7.json'))
  execFileSync(process.execPath, ['test/run.cjs'], { cwd: consumer, stdio: 'inherit' })

  writeFileSync(join(consumer, 'esm.mjs'), `
import assert from 'node:assert/strict'
import { generateThaiAstrologyChart, formatChannelOutputs, calculateSun } from 'thai-astrology'
const chart = generateThaiAstrologyChart({ day: 15, monthTh: 9, yearBe: 2566, hour: 14, minute: 45, province: 'กรุงเทพมหานคร' })
assert.deepEqual(chart.sunPosition, [27, 29])
assert.equal(formatChannelOutputs(chart)[8], 'ลั')
assert.equal(calculateSun(9, 2566, 15, 14, 45), chart.positions.sun)
`)
  execFileSync(process.execPath, ['esm.mjs'], { cwd: consumer, stdio: 'inherit' })

  const types = `
import { generateThaiAstrologyChart, formatChannelOutputs } from 'thai-astrology'
import type { CalculationInput, ThaiAstrologyChart } from 'thai-astrology'
const input: CalculationInput = { day: 15, monthTh: 9, yearBe: 2566, hour: 14, minute: 45, province: 'กรุงเทพมหานคร' }
const chart: ThaiAstrologyChart = generateThaiAstrologyChart(input)
const channels: string[] = formatChannelOutputs(chart, { numerals: 'thai' })
void channels
`
  writeFileSync(join(consumer, 'types.cts'), types)
  writeFileSync(join(consumer, 'types.mts'), types)
  execFileSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'),
    '--noEmit', '--strict', '--module', 'NodeNext', '--moduleResolution', 'NodeNext',
    '--target', 'ES2019', 'types.cts', 'types.mts'], { cwd: consumer, stdio: 'inherit' })
  console.log(`Package verified: ${paths.length} files; CommonJS, ESM imports, and TypeScript consumers pass`)
} finally {
  rmSync(temp, { recursive: true, force: true })
}
