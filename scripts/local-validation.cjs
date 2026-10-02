'use strict'

const { existsSync } = require('node:fs')
const { resolve } = require('node:path')

function runLocalValidation(packageRoot, label = 'local') {
  const entry = process.env.THAI_ASTROLOGY_LOCAL_VALIDATOR || resolve(__dirname, '../.example/validation/run.cjs')
  if (!existsSync(entry)) return { available: false }
  const result = require(entry)({ packageRoot: resolve(packageRoot), label })
  if (!result || result.passed !== true) throw new Error('Local validation failed; inspect the local report')
  console.log(`Local validation passed (${label}): ${result.tests} groups, ${result.comparisons} comparisons`)
  return { available: true, ...result }
}

module.exports = { runLocalValidation }
if (require.main === module) {
  runLocalValidation(process.argv[2] || resolve(__dirname, '..'))
}
