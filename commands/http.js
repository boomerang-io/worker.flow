const fetch = require("node-fetch");
const HttpsProxyAgent = require("https-proxy-agent");
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
    const { url, method, header, contentType, body } = taskProps;
    const headerObject = JSON.parse(header);
    const bodyStringfy = JSON.stringify(body);
    //TODO finish out passing in of parameters

    var agent = null;
    if (process.env.HTTP_PROXY) {
      log.debug("Using Proxy", process.env.HTTP_PROXY);
      agent = new HttpsProxyAgent(process.env.HTTP_PROXY);
    }

    fetch(url, {
      method,
      headers: {
        ...headerObject,
        "Content-Type": contentType
      },
      agent: agent,
      body: method !== "GET" ? bodyStringfy : null
    })
      .then(res => res.json())
      .then(body => {
        log.sys("Response Received:", JSON.stringify(body));
        utils.setOutputProperty("response", JSON.stringify(body));
        log.good("Response successfully received!");
      })
      .catch(err => {
        log.err(err);
        process.exit(1);
      });
    log.debug("Finished HTTP Call File Plugin");
  }
};
