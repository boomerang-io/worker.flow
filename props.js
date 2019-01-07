const log = require("./log.js");
const properties = require("properties");

var options = {
  path: true,
  namespaces: false,
  sections: false,
  variables: true,
  include: false
};

module.exports = {
  input() {
    return new Promise(function (resolve, reject) {
      properties.parse("/props/input.properties", options, function (err, obj) {
        if (err) {
          reject(err);
        }
        resolve(obj);
      });
    });
  },
  output(props) {
    log.debug("Inside Properties Output Utility");
  }
};
