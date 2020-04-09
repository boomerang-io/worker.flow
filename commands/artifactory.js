const log = require("../log.js");
const fetch = require("node-fetch");
var fs = require("fs");
var shell = require("shelljs");
const utils = require("../utils.js");

module.exports = {
  downloadFile() {
    log.debug("Started Artifactory Download File Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { url: url, username: username, password: password, destinationPath: destinationPath = "/data/file", apiKey: apiKey, accessToken: accessToken } = taskProps;

    if (!url) {
      log.err("no endpoint has been specified");
      process.exit(1);
    }

    const bearer_token = `Bearer ${accessToken}`;
    const user_token = `Basic ${username}:${password}`;

    let config = {
      method: "GET",
      headers: {}
    };

    if (accessToken) {
      config.withCredentials = true;
      config.credentials = "include";
      config.headers = { ...config.headers, Authorization: bearer_token }; //, 'Content-Type': 'application/json' };
    } else if (username && password) {
      config.headers = { ...config.headers, Authorization: user_token, "Content-Type": "application/json" };
    }

    if (apiKey) {
      config.headers = { ...config.headers, "X-JFrog-Art-Api": apiKey };
    }

    log.sys("request config:", JSON.stringify(config));

    fetch(url, config).then(res => {
      return new Promise((resolve, reject) => {
        const dest = fs.createWriteStream("file");
        res.body.pipe(dest);
        fs.rename("file", destinationPath, function(err) {
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

    if (username && password) {
      queryString = "curl -T " + file + " " + url + file + " --insecure -u " + username + ":" + password;
    } else if (apiKey) {
      queryString = "curl -T " + file + " " + url + file + "-H" + `X-JFrog-Art-Api:${apiKey}`;
    } else {
      log.debug("Authentication is not enabled");
    }

    /** @todo use more parameters */
    shell.exec(queryString);

    log.debug("Finished Artifactory Upload File Plugin");
  }
};
