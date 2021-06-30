const { log, utils } = require("@boomerang-io/worker-core");
const systemSleep = require("system-sleep");
const fs = require("fs");
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
    const taskProps = utils.resolveInputParameters();
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
    const { json, query } = utils.resolveInputParameters();

    if (!isValidJSON(json)) {
      log.err("Invalid JSON string passed to task");
      return process.exit(1);
    }

    log.debug("Json:", json);
    log.debug("Json Query:", query);
    log.sys("Commencing json parsing of", query, "query.");
    const propertyValue = jp.value(JSON.parse(json), query);
    log.sys("Finished parsing, value from query:", propertyValue);

    utils.setOutputParameter("evaluation", propertyValue);
    log.good("Parameter 'evaluation' set:", propertyValue);

    log.debug("Finished Json Path To Property Plugin");
  },
  jsonFilePathToProperty() {
    log.debug("Inside Json File Path To Property Plugin");

    //Destructure and get properties ready.
    const { filePath, query } = utils.resolveInputParameters();

    try {
      const fileContent = fs.readFileSync(filePath, "utf8");
      log.good("The file was succesfully read!");
      if (!isValidJSON(fileContent)) {
        log.err("Invalid JSON content in the file passed to task");
        return process.exit(1);
      }
      log.good("Valid JSON content in the file!");

      log.debug("Json:", JSON.parse(fileContent));
      log.debug("Json Query:", query);
      log.sys("Commencing json parsing of", query, "query.");
      const propertyValue = jp.value(JSON.parse(fileContent), query);
      log.sys("Finished parsing, value from query:", propertyValue);

      utils.setOutputParameter("evaluation", propertyValue);
      log.good("Parameter 'evaluation' set:", propertyValue);
    } catch (e) {
      log.err(e);
      process.exit(1);
    }

    log.debug("Finished Json File Path To Property Plugin");
  }
};
