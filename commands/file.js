const log = require("../log.js");
var fs = require("fs");

module.exports = {
  createFile() {
    log.debug("Started Create File Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    log.debug(taskProps);
    const { filePath: filePath, fileContent: fileContent } = taskProps;

    try {
      fs.writeFile(filePath + '', fileContent, err => {
        if (err) {
          log.err(err);
          throw err;
        }
        log.debug("The file was succesfully saved!");
      });
    } catch (e) {
      log.err(e);
      process.exit(1);
    }

    log.debug("Finished Create File Plugin");
  },
  readPropertiesFile() {
    log.debug("Started Read Properties File Plugin");

    log.debug("Finished Read Properties File Plugin");
  }
};
