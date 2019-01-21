#!/usr/bin/env node

const program = require("commander");
const log = require("./log.js");
const props = require("./utils.js");
require("dotenv").config();

async function cli() {
  //Import all Command Modules
  var commands = require("require-all")({
    dirname: __dirname + "/commands",
    filter: /(.+)\.js$/,
    excludeDirs: /^\.(git|svn)$/,
    recursive: true
  });

  //CLI Commands
  program.version("0.1.10").description("Boomerang Flow Worker CLI");
  log.sys("Boomerang Flow CLI", program.version());

  program
    .arguments("<cmd> <method>")
    .action((cmd, method) => {
      log.sys("Executing", cmd, method);
      commands[cmd][method]();
    });

  program.parse(process.argv);

}

cli();
