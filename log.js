#!/usr/bin/env node

const chalk = require("chalk");

module.exports = {
  out (message) {
    console.log(chalk.white('  ' + message))
  },
  sys (message) {
    console.log(chalk.white('🤖 ' + message))
  },
  warn (message) {
    console.log(chalk.yellow('⚠️ ' + message))
  },
  err (message) {
    console.log(chalk.red('❗ ' + message))
  }
}