const log = require("./log.js");
const properties = require("properties");

var inputOptions = {
  path: true,
  namespaces: false,
  sections: false,
  variables: true,
  include: false
};

var outputOptions = {
  path: "/props/output.properties",
  unicode: true
};

module.exports = {
  input() {
    return new Promise(function (resolve, reject) {
      properties.parse("/props/input.properties", inputOptions, function (err, obj) {
        if (err) {
          reject(err);
        }
        resolve(obj);
      });
    });
  },
  output(props) {
    log.debug("Inside Properties Output Utility");
  },
  exitCode(code) {
    log.debug("Inside Properties ExitCode Utility");
    properties.stringify({ "exitCode": code }, outputOptions, function (error, obj) {
      if (err) {
        reject(err);
      }
    });
  }
};
