const fetch = require("node-fetch");
const log = require("../log.js");
const utils = require("../utils.js");

module.exports = {
  //TODO implement a fetch that takes in;
  //  - URL
  //  - method (get, post, put, delete, patch, etc)
  //  - headers (new line delimitered list?)
  //  - body (optional depending on method)
  //  - content type (any, text, xml, json, html, etc)
  //  - option to allow untrusted SSL certs 

  execute() {
    log.debug("Started HTTP Call Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    log.debug(taskProps);
    const { url: url, method: method } = taskProps;

    //TODO finish out passing in of parameters
    fetch(
      url,
      {
        method: method,
        headers: {
        }
      }
    ).then(res => {
      return new Promise((resolve, reject) => {
        //TODO
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

    log.debug("Finished HTTP Call File Plugin");
  },

};
