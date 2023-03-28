const { log, utils } = require("@boomerang-io/worker-core");
const fs = require("fs");
const jp = require("jsonpath");
const { checkParameters, isValidJson } = require("../libs/utilities");

module.exports = {
  jsonPathToProperty() {
    log.debug("Inside Json Path To Property Plugin");

    //Destructure and get properties ready.
    const { json, query } = utils.resolveInputParameters();

    // Validate mandatory parameters
    if (checkParameters({ json, query })) {
      log.err(`Invalid mandatory parameters. Check log for details`);
      process.exit(1);
    }
    let newJSON = isValidJson(json);
    if (!newJSON) {
      log.err("Invalid JSON string passed to task");
      process.exit(1);
    }

    log.debug("Json:", newJSON);
    log.debug("Json Query:", query);
    log.sys("Commencing json parsing of", query, "query.");
    const propertyValue = jp.value(newJSON, query);
    log.sys("Finished parsing, value from query:", propertyValue);

    utils.setOutputParameter("evaluation", propertyValue);
    log.good("Parameter 'evaluation' set:", propertyValue);

    log.debug("Finished Json Path To Property Plugin");
  },
  jsonFilePathToProperty() {
    log.debug("Inside Json File Path To Property Plugin");

    //Destructure and get properties ready.
    const { filePath, query } = utils.resolveInputParameters();

    // Validate mandatory parameters
    if (checkParameters({ filePath, query })) {
      log.err(`Invalid mandatory parameters. Check log for details`);
      process.exit(1);
    }

    try {
      const fileContent = fs.readFileSync(filePath, "utf8");
      log.good("The file was succesfully read!");
      let newJSON = isValidJson(fileContent);
      if (!newJSON) {
        log.err("Invalid JSON content in the file passed to task");
        return process.exit(1);
      }
      log.good("Valid JSON content in the file!");

      log.debug("Json:", newJSON);
      log.debug("Json Query:", query);
      log.sys("Commencing json parsing of", query, "query.");
      const propertyValue = jp.value(newJSON, query);
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
