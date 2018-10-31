const log = require("../log.js");

module.exports = {
  downloadFile(req, inputProps) {
    log.debug("Inside Artifactory Download File Plugin");
  },
  uploadFile(req, inputProps) {
    log.debug("Inside Artifactory Upload File Plugin");
  }
};
