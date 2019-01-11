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
  log.debug("Start of CLI commands");
  program.version("0.1.8").description("Boomerang Flow Worker CLI");

  program
    .arguments("<cmd> <method>")
    .action((cmd, method) => {
      log.sys(cmd, method);
      commands[cmd][method]();
    });

  program.parse(process.argv);
}

cli();

//TODO: Write out to props
