const log = require("../log.js");
var fs = require("fs");
const utils = require("../utils.js");

module.exports = {
  createFile() {
    log.debug("Started Create File Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    log.debug(taskProps);
    const { path: path, content: content } = taskProps;

    try {
      fs.writeFile(path + '', content, err => {
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
  readFileToProperty() {
    log.debug("Started Read Properties File Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    log.debug(taskProps);
    const { path: path, propertyName: propertyName } = taskProps;

    //TODO Update to catch and fail if file is not there or any other error
    //To get the container to show failure, we have to exit the process with process.exit(1);
    const file = fs.readFileSync(path);

    utils.setOutputProperty(propertyName, file);

    log.debug("Finished Read Properties File Plugin");
  },
  readPropertiesFile() {
    log.debug("Started Read Properties File Plugin");

    // //Destructure and get properties ready.
    // const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    // log.debug(taskProps);
    // const { filePath: filePath, fileContent: fileContent } = taskProps;

    // const file = fs.readFileSync(filePath);

    // utils.setOutputProperty("fileContent", file);

    log.debug("Finished Read Properties File Plugin");
  }
};
