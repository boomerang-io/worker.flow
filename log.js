#!/usr/bin/env node
const chalk = require("chalk");
const datetime = require("node-datetime");

module.exports = {
  out(...args) {
    console.log(chalk.white("  ", args[1]));
  },
  debug(...args) {
    /** @todo make this only print out if the CLI is set to debug... environment property? */
    console.log(
      chalk.gray(`${datetime.create().format("m/d/y H:M:S")}`),
      "🔍 ",
      ...args
    );
  },
  sys(...args) {
    console.log(
      chalk.blue(`${datetime.create().format("m/d/y H:M:S")}`, "🤖 ", ...args)
    );
  },
  ci(...args) {
    console.log(
      chalk.blue(`${datetime.create().format("m/d/y H:M:S")}`, "🏗️ ", "-".repeat(20), ...args, "-".repeat(20))
    );
  },
  head(...args) {
    console.log(
      chalk.blue(`${datetime.create().format("m/d/y H:M:S")}`, "-".repeat(20), ...args, "-".repeat(20))
    );
  },
  good(...args) {
    console.log(
      chalk.green(`${datetime.create().format("m/d/y H:M:S")}`, "✅ ", ...args)
    );
  },
  warn(...args) {
    console.log(
      chalk.yellow(`${datetime.create().format("m/d/y H:M:S")}`, "⚠️ ", ...args)
    );
  },
  err(...args) {
    console.log(
      chalk.red(`${datetime.create().format("m/d/y H:M:S")}`, "❗ ", ...args)
    );
  }
};
