const log = require("../log.js");
var fs = require("fs");

module.exports = {
  createFile(req, inputProps) {
    log.debug("Started Create File Plugin");

    try {
      fs.writeFile(req.filePath + '', req.fileContent, err => {
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
  }
};
