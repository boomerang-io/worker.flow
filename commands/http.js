const { log, utils } = require("@boomerang-io/worker-core");
const HttpsProxyAgent = require("https-proxy-agent");
const https = require("https");
const Url = require("url");
const fs = require("fs");

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
    const taskProps = utils.resolveInputParameters();
    const { url, method, header, contentType, body, allowUntrustedCerts, outputFilePath } = taskProps;

    /**
     * turn header into object based upon new line delimeters
     */

    const headerObject = {};
    if (typeof header === "string" && header !== '""' && header !== '" "') {
      let headerSplitArr = header.split("\n");
      log.debug(headerSplitArr);
      headerSplitArr.forEach(line => {
        let key = line.substring(0, line.indexOf(":"));
        let value = line.substring(line.indexOf(":") + 1).trim();
        headerObject[key] = value;
      });
    }

    if (contentType && contentType !== '""' && contentType !== '" "') {
      headerObject["Content-Type"] = contentType;
    }

    if (body && body.length && body !== '""' && body !== '" "') {
      headerObject["Content-Length"] = body.length;
    }

    log.debug(headerObject);

    var agent = null;
    if (process.env.HTTP_PROXY) {
      if (!process.env.NO_PROXY) {
        log.debug("Using Proxy", process.env.HTTP_PROXY);
        log.debug("NO_PROXY list not provided by env");
        agent = new HttpsProxyAgent(process.env.HTTP_PROXY);
      } else {
        log.debug("NO_PROXY list detected", process.env.NO_PROXY);
        const noProxyList = process.env.NO_PROXY.split(",");
        let urltoUrl = new Url.URL(url);
        let urlHost = urltoUrl.host.split(":")[0];
        log.debug("urlHost:", urlHost);
        const skipProxy = noProxyList.some(domain => {
          log.debug("domain:", domain);
          log.debug(urlHost.endsWith(domain));
          return urlHost.endsWith(domain);
        });
        log.debug("skipProxy", skipProxy);
        if (!skipProxy) {
          log.debug("Using Proxy", process.env.HTTP_PROXY);
          agent = new HttpsProxyAgent(process.env.HTTP_PROXY);
        } else if (skipProxy) {
          log.debug("Not specifying proxy. Domain was found in no_proxy list");
        }
      }
    }

    let allowUntrustedFlag = false;

    if ((typeof allowUntrustedCerts === "string" && allowUntrustedCerts === "true") || (typeof allowUntrustedCerts === "boolean" && allowUntrustedCerts)) {
      log.sys(`Attempting HTTP request allowing untrusted certs`);
      allowUntrustedFlag = true;
    }

    const opts = Url.parse(url);
    opts.rejectUnauthorized = !allowUntrustedFlag;
    opts.agent = agent;
    opts.method = method;
    opts.headers = {
      ...headerObject
    };

    log.sys("Commencing to execute HTTP call with", opts);

    const req = https.request(opts, res => {
      log.debug(`statusCode: ${res.statusCode}`);
      utils.setOutputParameter("statusCode", JSON.stringify(res.statusCode));
      let output = "";

      res.on("data", d => {
        output += d;
      });

      res.on("end", () => {
        try {
          //make sure non-empty output is a valid JSON,
          //if not throw exception
          if (!(output === null || output.match(/^ *$/) !== null)) {
            JSON.parse(output);
          }
        } catch (e) {
          log.err(e);
          process.exit(1);
        }
        log.sys("Response Received:", output);
        if (outputFilePath && outputFilePath.length && outputFilePath !== '""' && outputFilePath !== '" "') {
          fs.writeFileSync(outputFilePath, output, err => {
            if (err) {
              log.err(err);
              throw err;
            }
            log.debug("The task output parameter successfully saved to provided file path.");
          });
        } else {
          utils.setOutputParameter("response", output);
          log.debug("The task output parameter successfully saved to standard response file.");
        }
        log.good("Response successfully received!");
      });
    });

    req.on("error", err => {
      log.err(err);
      process.exit(1);
    });

    if (body && body !== "" && body !== '""' && body !== '" "') {
      log.debug("writing request body");
      req.write(body);
    }

    req.end();
    log.debug("Finished HTTP Call File Plugin");
  }
};
