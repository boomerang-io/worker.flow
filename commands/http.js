const { log, utils } = require("@boomerang-io/worker-core");
const HttpsProxyAgent = require("https-proxy-agent");
const https = require("https");
const URL = require("url");
const fs = require("fs");
const HTTPRetryRequest = require("../libs/HTTPRetryRequest");
const { checkForJson, checkIfEmpty } = require("../libs/utilities");

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

    const { url, method, header, contentType, body, allowUntrustedCerts, outputFilePath, errorcodes = "", isErrorCodes = "failure", httperrorretry = 0, httpRetryDelay = 200 } = taskProps;

    // Input force defaults
    let newisErrorCodes = "failure";
    let newhttperrorretry = 0;
    let newhttpRetryDelay = 200;
    let newbody = "";
    // Input not "empty", set value
    if (!checkIfEmpty(isErrorCodes)) {
      newisErrorCodes = isErrorCodes.trim().toLowerCase(); // Input normalization
    }
    if (!checkIfEmpty(httperrorretry)) {
      newhttperrorretry = parseInt(httperrorretry, 10);
      if (isNaN(newhttperrorretry)) {
        log.err("Invalid input for: httperrorretry");
        process.exit(1);
      }
      if (newhttperrorretry < 0 || newhttperrorretry > 10) {
        log.err("Invalid input for: httperrorretry [0,10]");
        process.exit(1);
      }
    }
    if (!checkIfEmpty(httpRetryDelay)) {
      newhttpRetryDelay = parseInt(httpRetryDelay, 10);
      // parse test
      if (isNaN(newhttpRetryDelay)) {
        log.err("Invalid input for: httpRetryDelay");
        process.exit(1);
      }
      // bounds exceeded
      if (newhttpRetryDelay < 100 || newhttpRetryDelay > 30000) {
        log.err("Invalid input for: httpRetryDelay [100,30000]");
        process.exit(1);
      }
    }
    if (!checkIfEmpty(body)) {
      newbody = body.replace(/(\n|\r)/gm, "");
      checkForJson(newbody);
    }

    /**
     * turn header into object based upon new line delimeters
     */

    const headerObject = {};
    if (!checkIfEmpty(header)) {
      let headerSplitArr = header.split("\n");
      log.debug(headerSplitArr);
      headerSplitArr.forEach(line => {
        let arrHearder = line.split(":");
        if (arrHearder && arrHearder.length) {
          let key = arrHearder
            .shift()
            .trim()
            .replace(/("|')/g, ""); //take first string, the header
          let value = arrHearder
            .join(":")
            .trim()
            .replace(/("|')/g, ""); //rejoin all strings
          if (key) {
            // as per RFC 2616 Sec4.2 - value is optional https://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2
            headerObject[key] = value;
          }
        }
      });
    }

    if (contentType && contentType !== '""' && contentType !== '" "') {
      headerObject["Content-Type"] = contentType;
    }

    if (!checkIfEmpty(newbody)) {
      headerObject["Content-Length"] = ~-encodeURI(newbody).split(/%..|./).length;
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
      MAX_RETRIES: newhttperrorretry,
      DELAY: newhttpRetryDelay,
      IS_ERROR: newisErrorCodes === "failure"
    };
    if (!checkIfEmpty(newbody)) {
      log.debug("writing request body");
      config.body = newbody;
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
