const program = require("commander");
const { log } = require("@boomerang-worker/core");
require("dotenv").config();
const appRoot = require("app-root-path");

async function cli() {
  //Import all Command Modules
  var commands = require("require-all")({
    // dirname: __dirname + "/commands",
    dirname: `${appRoot}/commands`,
    filter: /(.+)\.js$/,
    excludeDirs: /^\.(git|svn)$/,
    recursive: true,
  });

  //CLI Commands
  program.version("4.0.0").description("Boomerang Worker CLI");
  log.sys(program.description(), program.version());

  program.option('-d, --debug', 'enable debugging')

  program.arguments("<cmd> <method>").action((cmd, method) => {
    if (program.debug) {
      process.env.DEBUG = "true";
    }
    log.sys("Executing", cmd, method);
    commands[cmd][method]();
  });

  program.parse(process.argv);
}

module.exports = cli;
