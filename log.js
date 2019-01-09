#!/usr/bin/env node

const chalk = require("chalk");
const datetime = require("node-datetime");

module.exports = {
  out(...args) {
    console.log(chalk.white("  ", args[1]));
  },
  debug(...args) {
    console.log(chalk.gray(`${datetime.create().format("m/d/y H:M:S")} "- debug:"`), ...args);
  },
  sys(...args) {
    console.log(chalk.white("🤖 ", ...args));
  },
  good(...args) {
    console.log(chalk.green("✅ ", ...args));
  },
  warn(...args) {
    console.log(chalk.yellow("⚠️ ", ...args));
  },
  err(...args) {
    console.log(chalk.red("❗ ", ...args));
  }
};
