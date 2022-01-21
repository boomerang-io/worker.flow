const { log, utils } = require("@boomerang-io/worker-core");
const HttpsProxyAgent = require("https-proxy-agent");
const https = require("https");
const URL = require("url");
const fs = require("fs");
const HTTPRetryRequest = require("../libs/HTTPRetryRequest");

module.exports = {
  /**
   * @todo implement a fetch that takes in;
   * URL [String]
   * method [Select - Options: get, post, put, patch, delete, options]
   * headers [Text Area - new line delimitered list?]
   * content type [Select - Options: any, text, xml, json, html]
   * body [Text Area - optional depending on method]
   * @param {string} errorcodes Represents a list of HTTP Status Codes, used either for error or success checks
   * @param {string} isErrorCodes Represents if the `errorcodes` param is used as failure (true) or success (false)
   * @param {int} httperrorretry Represents the number of retries that will be perfomed until success is obtained or the number of retries is achived
   * @param {int} httpRetryDelay Represents the number of miliseconds that will delay the next retry
   * Allow untrusted SSL certs [Boolean Toggle]
   */
  execute() {
    log.debug("Started HTTP Call Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.resolveInputParameters();

    const { url, method, header, contentType, body, allowUntrustedCerts, outputFilePath, errorcodes = "", isErrorCodes = "failure", httperrorretry = 3, httpRetryDelay = 200 } = taskProps;

    /**
     * turn header into object based upon new line delimeters
     */

    const headerObject = {};
    if (typeof header === "string" && header !== '""' && header !== '" "') {
      let headerSplitArr = header.split("\n");
      log.debug(headerSplitArr);
      headerSplitArr.forEach(line => {
        let arrHearder = line.split(":");
        if (arrHearder && arrHearder.length) {
          let key = arrHearder[0].trim().replace(/("|')/g, "");
          let value = arrHearder[1].trim().replace(/("|')/g, "");
          headerObject[key] = value;
        }
      });
    }

    if (contentType && contentType !== '""' && contentType !== '" "') {
      headerObject["Content-Type"] = contentType;
    }

    if (body && body.length && body !== '""' && body !== '" "') {
      headerObject["Content-Length"] = ~-encodeURI(body).split(/%..|./).length;
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
        let urltoUrl = new URL(url);
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

    const reqURL = new URL.URL(url);
    let opts = {};
    opts.rejectUnauthorized = !allowUntrustedFlag;
    opts.agent = agent;
    opts.method = method;
    opts.headers = {
      ...headerObject
    };

    log.sys("Commencing to execute HTTP call with", reqURL, JSON.stringify(opts));

    let config = {
      ERROR_CODES: errorcodes,
      MAX_RETRIES: httperrorretry, // default is 3
      DELAY: httpRetryDelay,
      IS_ERROR: isErrorCodes.toLowerCase() === "failure"
    };
    if (body && body !== "" && body !== '""' && body !== '" "') {
      log.debug("writing request body");
      config.body = body;
    }

    new HTTPRetryRequest(config, reqURL, opts)
      .then(res => {
        log.debug(`statusCode: ${res.statusCode}`);
        utils.setOutputParameter("statusCode", JSON.stringify(res.statusCode));
        try {
          log.debug(`output: ${res.body.toString()}`);
          //make sure non-empty output is a valid JSON,
          //if not throw exception
          if (!(res.body === null || res.body.toString().match(/^ *$/) !== null)) {
            JSON.parse(res.body.toString());
          }
          log.sys("Response Received:", res.body.toString());
        } catch (e) {
          log.err(e);
          process.exit(1);
        }
        if (outputFilePath && outputFilePath.length && outputFilePath !== '""' && outputFilePath !== '" "') {
          //https://nodejs.org/docs/latest-v14.x/api/fs.html#fs_fs_writefilesync_file_data_options
          fs.writeFileSync(outputFilePath, res.body, {
            encoding: "utf8",
            mode: 666,
            flag: "w"
          });
          log.debug("The task output parameter successfully saved to provided file path.");
        } else {
          utils.setOutputParameter("response", res.body.toString());
          log.debug("The task output parameter successfully saved to standard response file.");
        }
        log.good("Response successfully received!");
      })
      .catch(err => {
        log.err("HTTP Promise error:", err);
        process.exit(1);
      });

    log.debug("Finished HTTP Call File Plugin");
  }
};
