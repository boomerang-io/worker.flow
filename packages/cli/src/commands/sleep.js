const { log, utils } = require("@boomerang-worker/core");
const systemSleep = require("system-sleep");

module.exports = {
  sleep() {
    log.debug("Inside Sleep Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { duration } = taskProps;

    if (!duration || duration === '""') {
      log.err("No duration has been specified or was 0");
      return process.exit(1);
    }

    log.sys("Commencing sleep for", duration, "milliseconds.");

    systemSleep(duration);

    log.good("Finished sleeping for", duration, "milliseconds.");

    log.debug("Finished Sleep Plugin");
  }
};
