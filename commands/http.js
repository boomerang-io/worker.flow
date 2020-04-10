const HttpsProxyAgent = require("https-proxy-agent");
const https = require("https");
const URL = require("url");
const log = require("../log.js");
const utils = require("../utils.js");

module.exports = {
  /**
   * @todo implement a fetch that takes in;
   * URL [String]
   * method [Select - Options: get, post, put, patch, delete, options]
   * headers [Text Area - new line delimitered list?]
   * content type [Select - Options: any, text, xml, json, html]
   * body [Text Area - optional depending on method]
   * Allow untrusted SSL certs [Boolean Toggle]
   */

  execute() {
    log.debug("Started HTTP Call Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { url, method, header, contentType, body, allowUntrustedCerts } = taskProps;
    const headerObject = JSON.parse(header);
    const bodyStringfy = JSON.stringify(body);
    /** @todo finish out passing in of parameters*/

    var agent = null;
    if (process.env.HTTP_PROXY) {
      log.debug("Using Proxy", process.env.HTTP_PROXY);
      agent = new HttpsProxyAgent(process.env.HTTP_PROXY);
    }

    if (allowUntrustedCerts) {
      log.sys(`Attempting HTTP request allowing untrusted certs`);
    }

    const opts = URL.parse(url);
    opts.rejectUnauthorized = !allowUntrustedCerts;
    opts.agent = agent;
    opts.method = method;
    opts.header = {
      ...headerObject,
      "Content-Type": contentType
    };
    const req = https.request(opts, res => {
      log.sys(`statusCode: ${res.statusCode}`);
      let output = "";

      res.on("data", d => {
        output += d;
      });

      res.on("end", () => {
        const response = JSON.parse(output);
        log.sys("Response Received:", JSON.stringify(response));
        utils.setOutputProperty("response", JSON.stringify(response));
        log.good("Response successfully received!");
      });
    });

    req.on("error", err => {
      log.err(err);
      process.exit(1);
    });

    if (bodyStringfy && bodyStringfy !== "") {
      req.write(bodyStringfy);
    }

    req.end();
    log.debug("Finished HTTP Call File Plugin");
  }
};
