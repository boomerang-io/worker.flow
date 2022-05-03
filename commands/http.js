const { log, utils } = require("@boomerang-io/worker-core");
const HttpsProxyAgent = require("https-proxy-agent");
const URL = require("url");
const fs = require("fs");
const HTTPRetryRequest = require("../libs/HTTPRetryRequest");
const { checkIfEmpty } = require("../libs/utilities");

module.exports = {
  /**
   * @todo implement a fetch that takes in;
   * URL [String]
   * method [Select - Options: get, post, put, patch, delete, options]
   * headers [Text Area - new line delimitered list?]
   * content type [Select - Options: any, text, xml, json, html]
   * body [Text Area - optional depending on method]
   * @param {string} successcodes Represents a list of HTTP Status Codes, used for success checks
   * @param {string} retrycodes Represents a list of HTTP Status Codes, used for retry checks
   * @param {string} errorcodes Represents a list of HTTP Status Codes, used for error checks
   * @param {int} retrynumber Represents the number of retries that will be perfomed until success is obtained or the number of retries is achived
   * @param {int} retrydelay Represents the number of miliseconds that will delay the next retry
   * Allow untrusted SSL certs [Boolean Toggle]
   */
  execute() {
    log.debug("Started HTTP Call Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.resolveInputParameters();

    const { url, method, header, contentType, body, allowUntrustedCerts, outputFilePath, successcodes = "1xx,2xx", retrycodes = "502,503", errorcodes = "", retrynumber = 0, retrydelay = 200 } = taskProps;

    // Input force defaults
    let newretrynumber = 0;
    let newretrydelay = 200;
    let newbody = "";
    // Input not "empty", set value
    if (!checkIfEmpty(successcodes)) {
      newsuccesscodes = successcodes
        .toString()
        .trim()
        .toLowerCase(); // Input normalization
    }
    if (!checkIfEmpty(retrycodes)) {
      newretrycodes = retrycodes
        .toString()
        .trim()
        .toLowerCase(); // Input normalization
    }
    if (!checkIfEmpty(errorcodes)) {
      newerrorcodes = errorcodes
        .toString()
        .trim()
        .toLowerCase(); // Input normalization
    }
    if (!checkIfEmpty(retrynumber)) {
      newretrynumber = parseInt(retrynumber, 10);
      if (isNaN(newretrynumber)) {
        log.err("Invalid input for: retrynumber");
        process.exit(1);
      }
      if (newretrynumber < 1 || newretrynumber > 9) {
        log.err("Invalid input for: retrynumber [1,9]");
        process.exit(1);
      }
    }
    if (!checkIfEmpty(retrydelay)) {
      newretrydelay = parseInt(retrydelay, 10);
      // parse test
      if (isNaN(newretrydelay)) {
        log.err("Invalid input for: retrydelay");
        process.exit(1);
      }
      // bounds exceeded
      if (newretrydelay < 100 || newretrydelay > 300000) {
        log.err("Invalid input for: retrydelay [100,300000]");
        process.exit(1);
      }
    }
    if (!checkIfEmpty(body)) {
      newbody = body.replace(/(\n|\r)/gm, "");
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
      SUCCESS_CODES: successcodes.toString(), // Force string
      RETRY_CODES: retrycodes.toString(), // Force string
      ERROR_CODES: errorcodes.toString(), // Force string
      MAX_RETRIES: newretrynumber,
      DELAY: newretrydelay
    };
    if (!checkIfEmpty(newbody)) {
      log.debug("writing request body: \n ", newbody);
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
        // log.err("HTTP Promise error:", err, "Cause: ", err.cause);
        if (err.statusCode || err.statusMessage || err.body) {
          log.err(`HTTP Promise error:`);
          log.err(` \n Status Code: ${err.statusCode}`);
          log.err(` \n Status Message: ${err.statusMessage}`);
          log.err(` \n Response: ${err.body?.toString()}`);
        } else {
          log.err(`HTTP Promise error:`, err);
        }
        (async () => {
          await (async function(msg) {
            utils.setOutputParameter("statusCode", msg?.statusCode ?? "");
            utils.setOutputParameter("response", msg?.body?.toString() ?? msg.message);
          })(err);
          process.exit(1);
        })();
      });

    log.debug("Finished HTTP Call File Plugin");
  }
};
