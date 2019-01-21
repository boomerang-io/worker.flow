const log = require("./../log.js");
const systemSleep = require("system-sleep");
const utils = require("../utils.js");

module.exports = {
  sleep() {
    log.debug("Inside Sleep Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { duration } = taskProps;

    if (!duration) {
      log.err('No duration has been specified');
      return process.exit(1);
    }

    systemSleep(duration);

    log.debug("Finished Sleep Plugin");
  }
};
