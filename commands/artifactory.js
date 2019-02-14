const log = require("../log.js");
const fetch = require("node-fetch");
var fs = require("fs");
var shell = require("shelljs");

module.exports = {
  downloadFile() {
    log.debug("Started Artifactory Download File Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const {} = taskProps;

    //TODO update to use params
    fetch(
      "https://tools.boomerangplatform.net/artifactory/boomerang/test/hello",
      {
        method: "GET",
        headers: {
          "X-JFrog-Art-Api":
            "AKCp5Z2NfDUZgvYrspbPwhR1byifksXAgJSFTssz5tG7wj41RyfgM1pJxPPn5FRZqTwrhtNZx"
        }
      }
    ).then(res => {
      return new Promise((resolve, reject) => {
        const dest = fs.createWriteStream("file");
        res.body.pipe(dest);
        fs.rename("file", "/data/file", function(err) {
          if (err) throw err;
          console.log("Successfully renamed - AKA moved!");
        });
        res.body.on("error", err => {
          reject(err);
        });
        dest.on("finish", () => {
          resolve();
        });
        dest.on("error", err => {
          reject(err);
        });
      });
    });

    log.debug("Finished Artifactory Download File Plugin");
  },
  uploadFile(req, inputProps) {
    log.debug("Started Artifactory Upload File Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const {
      url: url,
      file: file,
      username: username,
      password: password
    } = taskProps;

    //TODO use more parameters
    shell.exec(
      "curl -T " +
        file +
        " " +
        url +
        file +
        " --insecure -u " +
        username +
        ":" +
        password
    );

    log.debug("Finished Artifactory Upload File Plugin");
  }
};
