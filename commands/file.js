const log = require("../log.js");
var fs = require("fs");

module.exports = {
  createFile(req, inputProps) {
    log.debug("Started Create File Plugin");

    fs.writeFile(req.path, req.content, err => {
      if (err) {
        log.err(err);
        throw err;
      }
      log.debug("The file was succesfully saved!");
    });

    log.debug("Finished Create File Plugin");
  }
};
