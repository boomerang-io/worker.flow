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
    const { url, method, header, contentType, body } = taskProps;
    const headerObject = JSON.parse(header);
    const bodyStringfy = JSON.stringify(body);
    //TODO finish out passing in of parameters
    fetch(
      url,
      {
        method,
        "headers": {
          ...headerObject,
          "Content-Type":contentType
        },
        "body": method !== "GET"? bodyStringfy:null
      }
    ).then(res => res.json())
    .then(body=> {
      console.log(body,"Response");
      utils.setOutputProperty("requestRes",body);
    })
    .catch(err => {
      console.log(err);
    });
    log.debug("Finished HTTP Call File Plugin");
  },
};
