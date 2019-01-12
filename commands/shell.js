const log = require("../log.js");
const utils = require("../utils.js");
var shell = require('shelljs');

module.exports = {
  execute() {
    log.debug("Inside Shell Plugin");

    // config = {
    //   verbose: false,
    // }

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    log.debug(taskProps);
    const { path: path, script: script } = taskProps;

    if (!path) {
      path = shell.tempdir();
    }

    //TODO get this to fail if directory doesn't exist
    try {
      shell.cd(path);
    } catch (err) {
      log.err(err);
      return process.exit(1);
    }

    // shell.cd('/tmp');

    shell.exec(script, { verbose: true }, async function (code, stdout, stderr) {
      if (code != 0) {
        log.err('  Exit code:', code);
        log.err('  Program stderr:', stderr);
        return process.exit(code);
      }
    });

    log.debug("End Shell Plugin");
  }
};
