const { log, utils } = require("@boomerang-worker/core");
const HttpsProxyAgent = require("https-proxy-agent");
const https = require("https");
const URL = require("url");

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

    var agent = null;
    if (process.env.HTTP_PROXY) {
      log.debug("Using Proxy", process.env.HTTP_PROXY);
      agent = new HttpsProxyAgent(process.env.HTTP_PROXY);
    }

    let allowUntrustedFlag = false;

    if ((typeof allowUntrustedCerts === "string" && allowUntrustedCerts === "true") || (typeof allowUntrustedCerts === "boolean" && allowUntrustedCerts)) {
      log.sys(`Attempting HTTP request allowing untrusted certs`);
      allowUntrustedFlag = true;
    }

    const opts = URL.parse(url);
    opts.rejectUnauthorized = !allowUntrustedFlag;
    opts.agent = agent;
    opts.method = method;
    opts.headers = {
      ...headerObject,
      "Content-Type": contentType,
      "Content-Length": body.length
    };

    const req = https.request(opts, res => {
      log.debug(`statusCode: ${res.statusCode}`);
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

    if (body && body !== "") {
      log.debug("writing request body");
      req.write(body);
    }

    req.end();
    log.debug("Finished HTTP Call File Plugin");
  }
};
