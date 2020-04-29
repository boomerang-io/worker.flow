const { log, utils } = require("@boomerang-worker/core");
const systemSleep = require("system-sleep");
const jp = require("jsonpath");

// Borrowed from https://stackoverflow.com/questions/3710204/how-to-check-if-a-string-is-a-valid-json-string-in-javascript-without-using-try
function isValidJSON(jsonString) {
  try {
    const obj = JSON.parse(jsonString);
    return typeof obj === "object";
  } catch (e) {
    return false;
  }
}

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
  },
  jsonPathToProperty() {
    log.debug("Inside Json Path To Property Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { json, query, propertyKey } = taskProps;

    if (!isValidJSON(json)) {
      log.err("Invalid JSON string passed to task");
      return process.exit(1);
    }

    log.debug("Json:", json);
    log.debug("Json Query:", query);
    var propertyValue = jp.value(JSON.parse(json), query);
    log.debug("Value from Query:", propertyValue);

    utils.setOutputProperty(propertyKey, propertyValue);

    log.debug("Finished Json Path To Property Plugin");
  }
};
