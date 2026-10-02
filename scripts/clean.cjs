'use strict'

const { rmSync } = require('node:fs')
const { resolve } = require('node:path')

rmSync(resolve(__dirname, '../dist'), { recursive: true, force: true })
