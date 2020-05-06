const { log, utils } = require("@boomerang-worker/core");
const fetch = require("node-fetch");
var fs = require("fs");
var shell = require("shelljs");

module.exports = {
  downloadFile() {
    log.debug("Started Artifactory Download File Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { url: url, username: username, password: password, destinationPath: destinationPath = "output_file", apiKey: apiKey } = taskProps;

    if (!url) {
      log.err("no endpoint has been specified");
      process.exit(1);
    }

    const user_token = `Basic ${username}:${password}`;

    let config = {
      method: "GET",
      headers: {}
    };

    if (apiKey) {
      config.headers = { ...config.headers, "X-JFrog-Art-Api": apiKey };
    } else if (username && password) {
      config.headers = { ...config.headers, Authorization: user_token, "Content-Type": "application/json" };
    }

    log.sys("request config:", JSON.stringify(config));

    fetch(url, config)
      .then(res => {
        const dest = fs.createWriteStream(destinationPath);
        res.body.pipe(dest);
        res.body.on("error", err => {
          log.err(err);
          process.exit(1);
        });
        dest.on("finish", () => {
          log.sys(`Successfully copied file to ${destinationPath}`);
        });
        dest.on("error", err => {
          log.err(err);
          process.exit(1);
        });
      })
      .catch(err => {
        log.err(err);
        process.exit(1);
      });

    log.debug("Finished Artifactory Download File Plugin");
  },
  uploadFile() {
    log.debug("Started Artifactory Upload File Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { url: url, file: file, username: username, password: password, apiKey: apiKey } = taskProps;

    if (!file) {
      log.err("no file has been specified");
      process.exit(1);
    }
    if (!url) {
      log.err("no endpoint has been specified");
      process.exit(1);
    }

    let queryString = "";

    if (apiKey) {
      queryString = "curl -T " + file + " " + url + file + " -H" + `X-JFrog-Art-Api:${apiKey}`;
    } else if (username && password) {
      queryString = "curl -T " + file + " " + url + file + " --insecure -u " + username + ":" + password;
    } else {
      log.debug("Authentication is not enabled");
    }

    log.sys("queryString:", queryString);

    /** @todo use more parameters */
    shell.exec(queryString);

    log.debug("Finished Artifactory Upload File Plugin");
  }
};
