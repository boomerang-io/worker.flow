const fetch = require("node-fetch");
const log = require("../log.js");
const utils = require("../utils.js");

module.exports = {
  //TODO implement a fetch that takes in;
  //  - URL [String]
  //  - method [Select - Options: get, post, put, patch, delete, options] 
  //  - headers [Text Area - new line delimitered list?]
  //  - content type [Select - Options: any, text, xml, json, html]
  //  - body [Text Area - optional depending on method]
  //  - Allow untrusted SSL certs [Boolean Toggle]

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
          //TODO headers parameter
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
