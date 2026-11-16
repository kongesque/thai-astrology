'use strict'

const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join, resolve } = require('node:path')
const { withClient, checkTools } = require('../test/client-check.cjs')
const adapter = resolve(__dirname, '..')
const core = resolve(adapter, '../..')
const temp = mkdtempSync(join(tmpdir(), 'thai-astrology-mcp-package-'))

function npm(args, cwd) {
  return execFileSync(process.execPath, [process.env.npm_execpath, ...args], { cwd, encoding: 'utf8' })
}

async function main() {
  try {
    const [coreArchive] = JSON.parse(npm(['pack', '--json', '--pack-destination', temp], core))
    const [adapterArchive] = JSON.parse(npm(['pack', '--json', '--pack-destination', temp], adapter))
    const coreMetadata = require(join(core, 'package.json'))
    assert.equal(coreMetadata.dependencies, undefined, 'MCP must not add core runtime dependencies')
    assert.ok(coreArchive.files.every(file => !file.path.startsWith('adapters/')), 'Adapter must remain outside the core archive')
    const paths = adapterArchive.files.map(file => file.path)
    for (const required of ['src/server.cjs', 'bin/thai-astrology-mcp.cjs', 'README.md', 'package.json']) assert.ok(paths.includes(required))
    assert.ok(paths.every(path => /^(src\/server\.cjs|bin\/thai-astrology-mcp\.cjs|README\.md|package\.json|LICENSE)$/.test(path)), 'Unexpected adapter archive file')
    const consumer = join(temp, 'consumer')
    mkdirSync(consumer)
    writeFileSync(join(consumer, 'package.json'), JSON.stringify({ private: true }))
    npm(['install', join(temp, coreArchive.filename), join(temp, adapterArchive.filename), '--prefer-offline', '--ignore-scripts', '--no-audit', '--no-fund'], consumer)
    const installed = join(consumer, 'node_modules', 'thai-astrology-mcp')
    const metadata = JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8'))
    assert.equal(metadata.bin['thai-astrology-mcp'], 'bin/thai-astrology-mcp.cjs')
    // Exercise the installed executable link with a real SDK client, not a source import.
    await withClient({
      command: process.execPath,
      args: [process.env.npm_execpath, 'exec', '--offline', '--', 'thai-astrology-mcp'],
      cwd: consumer,
    }, checkTools)
    console.log('MCP archive verified: installed executable, SDK client, discovery and all five tools pass')
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
