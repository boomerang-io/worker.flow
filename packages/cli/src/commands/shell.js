const { log, utils } = require("@boomerang-worker/core");
const shelljs = require("shelljs");

module.exports = {
  execute() {
    log.debug("Inside Shell Plugin");

    // shelljs.config.verbose = true;
    // shelljs.config.fatal = true;

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { path, shell, script } = taskProps;

    let dir;
    if (!path || path === '""') {
      dir = "/tmp";
      log.debug("No directory specified. Defaulting...");
    } else {
      dir = path;
    }
    shelljs.config.silent = true; //set to silent otherwise CD will print out no such file or directory if the directory doesn't exist
    shelljs.cd(dir);
    //shelljs.cd -> does not have an error handling call back and will default to current directory of /cli
    if (shelljs.pwd().toString() !== dir.toString()) {
      log.err("No such file or directory:", dir);
      return process.exit(1);
    }
    shelljs.config.silent = false;

    let config = {
      verbose: false,
    };
    if (!shell || shell === '""') {
      log.debug("No shell interpreter specified. Defaulting...");
    } else {
      config.shell = shell;
    }
    log.debug("Script to execute:", script);
    shelljs.exec(script, config, function (code, stdout, stderr) {
      if (code != 0) {
        log.err("  Exit code:", code);
        log.err("  Program stderr:", stderr);
        return process.exit(code);
      }
    });

    log.debug("End Shell Plugin");
  },
};
