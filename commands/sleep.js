const log = require("./../log.js");
const systemSleep = require("system-sleep");
const utils = require("../utils.js");

module.exports = {
  sleep() {
    log.debug("Inside Sleep Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    log.debug(taskProps);
    const { duration: duration } = taskProps;

    systemSleep(duration);

    log.debug("Finished Sleep Plugin");
  }
};
