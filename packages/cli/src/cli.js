const program = require("commander");
require("dotenv").config();
const { log } = require("@boomerang-worker/core");

async function cli(process) {
  //Import all Command Modules
  var commands = require("require-all")({
    // dirname: __dirname + "/commands",
    dirname: `${process.cwd()}/commands`,
    filter: /(.+)\.js$/,
    excludeDirs: /^\.(git|svn)$/,
    recursive: true,
  });

  //CLI Commands
  program.version("4.0.0").description("Boomerang Worker CLI");
  log.sys(program.description(), program.version());

  program.option("-d, --debug", "enable debugging");

  program.arguments("<cmd> <method>").action((cmd, method) => {
    log.sys("Executing", cmd, method);
    commands[cmd][method]();
  });

  program.parse(process.argv);
}

module.exports = cli;
