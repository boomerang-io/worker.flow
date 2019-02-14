const log = require("../log.js");
const utils = require("../utils.js");
var shell = require("shelljs");

module.exports = {
  execute() {
    log.debug("Inside Shell Plugin");

    // shell.config.verbose = true;
    // shell.config.fatal = true;
    // config = {
    //   verbose: false,
    // }

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { path, script } = taskProps;

    let dir = path;
    if (!path) {
      dir = "/tmp";
    }
    shell.config.silent = true; //set to silent otherwise CD will print out no such file or directory if the directory doesn't exist
    shell.cd(dir);
    //shell.cd -> does not have an error handling call back and will default to current directory of /cli
    if (shell.pwd().toString() !== dir.toString()) {
      log.err("No such file or directory:", dir);
      return process.exit(1);
    }
    shell.config.silent = false;

    log.debug("Script to execute:", script);

    shell.exec(script, { verbose: true }, function(code, stdout, stderr) {
      if (code != 0) {
        log.err("  Exit code:", code);
        log.err("  Program stderr:", stderr);
        return process.exit(code);
      }
    });

    log.debug("End Shell Plugin");
  }
};
