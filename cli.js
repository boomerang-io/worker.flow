#!/usr/bin/env node

const program = require("commander");
const log = require("./log.js");
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
  program.version("1.0.0-beta.2").description("Boomerang Flow CLI");
  log.sys(program.description(), program.version());

  program.arguments("<cmd> <method>").action((cmd, method) => {
    log.sys("Executing", cmd, method);
    commands[cmd][method]();
  });

  program.parse(process.argv);
}

cli();
