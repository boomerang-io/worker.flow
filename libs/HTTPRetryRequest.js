const https = require("https");
const http = require("http");
const { log } = require("@boomerang-io/worker-core");
const utilities = require("./utilities");
// TODO: replace after node version is above 15.0.0
// const { setTimeout: setTimeoutPromise } = require('timers/promises');
const { checkForJson } = require("./../libs/utilities");

let DEFAULTS = {
  SUCCESS_CODES: "",
  RETRY_CODES: "",
  ERROR_CODES: "",
  MAX_RETRIES: 5,
  DELAY: 200,
  IS_ERROR: true
};

function HTTPRetryRequest(config, URL, options) {
  // TODO: only for testing with selfsigned certificate
  // process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  let _self = this;
  _self.URL = URL;
  _self.client = /^https:\/\//g.test(_self.URL) ? https : http;
  _self.options = options;
  // log.debug("HTTP Request Options:", _self.options);
  _self.config = { ...DEFAULTS, ...config }; // overwrite defaults
  // log.debug("HTTP Request Config:", _self.config);
  if (_self.config.SUCCESS_CODES && _self.config.SUCCESS_CODES.length) {
    // create pattern of /(5\d\d|4\d\d|9\d\d)/
    // TODO: replace back with replaceAll after node version is above 15.0.0
    // _self.config.SUCCESS_CODES = _self.config.SUCCESS_CODES.replaceAll(",", "|"); // replace sperator , with | for regex
    _self.config.SUCCESS_CODES = _self.config.SUCCESS_CODES.replace(/\,/g, "|"); // replace sperator , with | for regex
    _self.config.SUCCESS_CODES = _self.config.SUCCESS_CODES.toUpperCase(); // make uppercase (x -> X)
    // TODO: replace back with replaceAll after node version is above 15.0.0
    // _self.config.SUCCESS_CODES = _self.config.SUCCESS_CODES.replaceAll("X", "\\d"); // replace character X with \d for regex - represents a digit
    _self.config.SUCCESS_CODES = _self.config.SUCCESS_CODES.replace(/X/g, "\\d"); // replace character X with \d for regex - represents a digit
    _self.config.SUCCESS_CODES = new RegExp("(" + _self.config.SUCCESS_CODES + ")"); // wrap in () to have the alternative
  }
  if (_self.config.RETRY_CODES && _self.config.RETRY_CODES.length) {
    // create pattern of /(5\d\d|4\d\d|9\d\d)/
    // TODO: replace back with replaceAll after node version is above 15.0.0
    // _self.config.RETRY_CODES = _self.config.RETRY_CODES.replaceAll(",", "|"); // replace sperator , with | for regex
    _self.config.RETRY_CODES = _self.config.RETRY_CODES.replace(/\,/g, "|"); // replace sperator , with | for regex
    _self.config.RETRY_CODES = _self.config.RETRY_CODES.toUpperCase(); // make uppercase (x -> X)
    // TODO: replace back with replaceAll after node version is above 15.0.0
    // _self.config.RETRY_CODES = _self.config.RETRY_CODES.replaceAll("X", "\\d"); // replace character X with \d for regex - represents a digit
    _self.config.RETRY_CODES = _self.config.RETRY_CODES.replace(/X/g, "\\d"); // replace character X with \d for regex - represents a digit
    _self.config.RETRY_CODES = new RegExp("(" + _self.config.RETRY_CODES + ")"); // wrap in () to have the alternative
  }
  if (_self.config.ERROR_CODES && _self.config.ERROR_CODES.length) {
    // create pattern of /(5\d\d|4\d\d|9\d\d)/
    // TODO: replace back with replaceAll after node version is above 15.0.0
    // _self.config.ERROR_CODES = _self.config.ERROR_CODES.replaceAll(",", "|"); // replace sperator , with | for regex
    _self.config.ERROR_CODES = _self.config.ERROR_CODES.replace(/\,/g, "|"); // replace sperator , with | for regex
    _self.config.ERROR_CODES = _self.config.ERROR_CODES.toUpperCase(); // make uppercase (x -> X)
    // TODO: replace back with replaceAll after node version is above 15.0.0
    // _self.config.ERROR_CODES = _self.config.ERROR_CODES.replaceAll("X", "\\d"); // replace character X with \d for regex - represents a digit
    _self.config.ERROR_CODES = _self.config.ERROR_CODES.replace(/X/g, "\\d"); // replace character X with \d for regex - represents a digit
    _self.config.ERROR_CODES = new RegExp("(" + _self.config.ERROR_CODES + ")"); // wrap in () to have the alternative
  }
  if (!_self.config.retryCount) {
    _self.config.retryCount = 1;
  } else {
    _self.config.retryCount++;
  }
  _self.buffer = Buffer.alloc(0);

  return new Promise((resolve, reject) => {
    let requestInstance = _self.client.request(_self.URL, _self.options, response => {
      const innerStatusCode = response.statusCode.toString();
      const responseInstance = response
        .on("error", error => {
          log.debug(`Retry onError #${_self.config.retryCount} HTTP Status Code: ${innerStatusCode} \n Status Message: ${response.statusMessage.toString()} \n Response ${_self.buffer.toString()}.`);
          responseInstance.abort();
          if (_self.config.ERROR_CODES && _self.config.ERROR_CODES.test(innerStatusCode)) {
            log.debug(`onError - user specific error reject.`);
            reject(error);
            return;
          }
          if (_self.config.SUCCESS_CODES && _self.config.SUCCESS_CODES.test(innerStatusCode)) {
            // Success branch and one of the status codes is found, resolve with success
            resolve({
              statusCode: innerStatusCode,
              body: Buffer.alloc(0) // empty body
            });
            return; // exit to avoid next call
          }
          if (_self.config.RETRY_CODES && _self.config.RETRY_CODES.test(innerStatusCode) && _self.config.retryCount <= _self.config.MAX_RETRIES) {
            setTimeout(timeOutRetry, _self.config.DELAY, _self.config, _self.URL, _self.options, resolve);
            // TODO: replace after node version is above 15.0.0
            // log.debug(`Retry onError #${_self.config.retryCount} next call.`);
            // resolve(setTimeoutPromise(_self.config.DELAY, new HTTPRetryRequest( _self.config, _self.URL, _self.options)));
            return;
          }
          log.debug(`onError - other error reject.`);
          reject(error);
        })
        .on("data", chunk => (_self.buffer = Buffer.concat([_self.buffer, chunk])))
        .on("end", () => {
          log.debug(`Retry onEnd #${_self.config.retryCount} HTTP Status Code: ${innerStatusCode} \n Status Message: ${response.statusMessage.toString()} \n Response ${_self.buffer.toString()}.`);
          if (_self.config.ERROR_CODES && _self.config.ERROR_CODES.test(innerStatusCode)) {
            log.debug(`onEnd - user specific error reject.\n StatusMessage: ${response.statusMessage.toString()} \n Response ${_self.buffer.toString()}.`);
            reject({
              statusCode: innerStatusCode,
              statusMessage: response.statusMessage,
              body: _self.buffer
            });
          }
          if (_self.config.SUCCESS_CODES && (_self.config.SUCCESS_CODES.test(innerStatusCode) || /2\d\d/g.test(innerStatusCode.toString()))) {
            log.debug(`onEnd #${_self.config.retryCount} resolve.`);
            // Success branch and one of the status codes is found, resolve with success
            resolve({
              statusCode: innerStatusCode,
              body: _self.buffer
            });
            return; // exit to avoid next call
          }
          if (_self.config.RETRY_CODES && _self.config.RETRY_CODES.test(innerStatusCode) && _self.config.retryCount <= _self.config.MAX_RETRIES) {
            setTimeout(timeOutRetry, _self.config.DELAY, _self.config, _self.URL, _self.options, resolve);
            // TODO: replace after node version is above 15.0.0
            // log.debug(`Retry onError #${_self.config.retryCount} next call.`);
            // resolve(setTimeoutPromise(_self.config.DELAY, new HTTPRetryRequest( _self.config, _self.URL, _self.options)));
            return;
          }
          // no more tries, just reject
          log.debug(`onEnd reject \n StatusMessage: ${response.statusMessage.toString()} \n Response ${_self.buffer.toString()}.`);
          // reject(new Error(innerStatusCode, { cause: `StatusMessage: ${response.statusMessage.toString()} \n Response ${_self.buffer.toString()}.`}));
          reject({
            statusCode: innerStatusCode,
            statusMessage: response.statusMessage,
            body: _self.buffer
          });
        });
    });
    requestInstance.on("error", err => {
      log.debug(`requestInstance onEnd #${_self.config.retryCount} reject.`);
      // other type of error prior to response
      reject(err);
    });
    if (_self.config.body && _self.config.body.trim()) {
      requestInstance.write(_self.config.body.trim());
    }
    requestInstance.end();
  });
}

function timeOutRetry(config, url, options, newResolve) {
  log.debug(`Retry #${config.retryCount} next call.`);
  newResolve(new HTTPRetryRequest(config, url, options));
}

module.exports = HTTPRetryRequest;
