#!/usr/bin/env node
'use strict'

const { readFileSync } = require('node:fs')

const help = `Usage:
  thai-astrology tools [--pretty]
  thai-astrology schemas [tool] [--pretty]
  thai-astrology call <tool> [--input <file|->] [--pretty]
  thai-astrology --help
  thai-astrology --version

call reads one UTF-8 JSON argument object from stdin by default.
--input - also selects stdin. Files contain the same tool argument object.
tools and schemas do not read stdin. JSON results go to stdout.
Errors also write a short diagnostic to stderr.

Exit codes:
  0  Completed (validation may report data.valid: false)
  1  Tool failure (see error.code and error.issues)
  2  Invalid command, unreadable input, or malformed JSON
  3  Unexpected internal error
`

class CliError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

let pretty = false
const success = data => ({ schemaVersion: '1.0', ok: true, data })
const failure = (code, message) => ({ schemaVersion: '1.0', ok: false, error: { code, message } })

function emit(result, exitCode) {
  process.stdout.write(JSON.stringify(result, null, pretty ? 2 : undefined) + '\n')
  if (!result.ok) process.stderr.write(`${result.error.code}: ${result.error.message}\n`)
  // Let stdout drain even when a full transit result is larger than a pipe buffer.
  process.exitCode = exitCode
}

function run(argv) {
  if (argv.length === 1 && (argv[0] === '--help' || argv[0] === '-h')) {
    process.stdout.write(help)
    return
  }
  if (argv.length === 1 && argv[0] === '--version') {
    emit(success({ version: require('../package.json').version }), 0)
    return
  }
  const [command, ...tokens] = argv
  if (!['tools', 'schemas', 'call'].includes(command)) throw new CliError('CLI_USAGE_ERROR', 'Use tools, schemas, or call; see --help')
  const operands = []
  let inputFile
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]
    if (token === '--pretty' && !pretty) pretty = true
    else if (token === '--input' && inputFile === undefined && command === 'call') {
      inputFile = tokens[++index]
      if (!inputFile || inputFile.startsWith('--')) throw new CliError('CLI_USAGE_ERROR', '--input requires a filename or -')
    } else if (token.startsWith('-')) throw new CliError('CLI_USAGE_ERROR', 'Unknown, duplicate, or misplaced option; see --help')
    else operands.push(token)
  }
  if (command === 'tools' && operands.length || command === 'schemas' && operands.length > 1 || command === 'call' && operands.length !== 1) {
    throw new CliError('CLI_USAGE_ERROR', 'Incorrect command arguments; see --help')
  }

  const { executeThaiAstrologyTool, getThaiAstrologyTools } = require('../dist/tools.js')
  if (command === 'tools') {
    emit(success(getThaiAstrologyTools()), 0)
    return
  }
  if (command === 'schemas') {
    const { getThaiAstrologySchemas } = require('../dist/schemas.js')
    const schemas = getThaiAstrologySchemas()
    const name = operands[0]
    if (name !== undefined && !Object.prototype.hasOwnProperty.call(schemas, name)) {
      emit(failure('UNKNOWN_TOOL', 'Unknown astrology tool'), 1)
      return
    }
    emit(success(name === undefined ? schemas : schemas[name]), 0)
    return
  }

  if ((inputFile === undefined || inputFile === '-') && process.stdin.isTTY) {
    throw new CliError('CLI_USAGE_ERROR', 'Pipe JSON arguments to stdin or use --input <file>')
  }
  let source
  try {
    source = readFileSync(inputFile === undefined || inputFile === '-' ? 0 : inputFile, 'utf8')
  } catch {
    throw new CliError('INPUT_READ_ERROR', 'Unable to read UTF-8 JSON input')
  }
  let args
  try {
    args = JSON.parse(source)
  } catch {
    // Parser diagnostics can include birth records; report the failure without echoing input.
    throw new CliError('INVALID_JSON', 'Expected one complete JSON value using UTF-8, without a BOM')
  }
  const result = executeThaiAstrologyTool(operands[0], args)
  emit(result, result.ok ? 0 : 1)
}

process.stdout.on('error', error => {
  // A downstream consumer may intentionally stop reading a long schema/result.
  if (error.code === 'EPIPE') return
  process.stderr.write('OUTPUT_WRITE_ERROR: Unable to write JSON output\n')
  process.exitCode = 3
})

try {
  run(process.argv.slice(2))
} catch (error) {
  if (error instanceof CliError) emit(failure(error.code, error.message), 2)
  else emit(failure('INTERNAL_ERROR', 'Unexpected CLI failure'), 3)
}
