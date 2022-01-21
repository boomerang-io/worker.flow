const https = require("https");
const { log } = require("@boomerang-io/worker-core");
// TODO: replace after node version is above 15.0.0
// const { setTimeout: setTimeoutPromise } = require('timers/promises');

let DEFAULTS = {
  MAX_RETRIES: 5,
  ERROR_CODES: "",
  DELAY: 200,
  IS_ERROR: true
};

function HTTPRetryRequest(config, URL, options) {
  // TODO: only for testing with selfsigned certificate
  // process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  let _self = this;
  _self.URL = URL;
  _self.options = options;
  // log.debug("HTTP Request Options:", _self.options);
  _self.config = { ...DEFAULTS, ...config }; // overwrite defaults
  // log.debug("HTTP Request Config:", _self.config);
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
    let requestInstance = https.request(_self.URL, _self.options, response => {
      const innerStatusCode = response.statusCode.toString();
      const responseInstance = response
        .on("error", error => {
          log.debug(`Retry onError #${_self.config.retryCount} HTTP Status Code: ${innerStatusCode}`);
          responseInstance.abort();
          if (_self.config.ERROR_CODES && _self.config.ERROR_CODES.test(innerStatusCode) && _self.config.retryCount <= _self.config.MAX_RETRIES) {
            if (!_self.config.IS_ERROR) {
              // Success branch and one of the status codes is found, resolve with success
              resolve({
                statusCode: innerStatusCode,
                body: Buffer.alloc(0) // empty body
              });
              return; // exit to avoid next call
            }
            setTimeout(timeOutRetry, _self.config.DELAY, _self.config, _self.URL, _self.options, resolve);
            // TODO: replace after node version is above 15.0.0
            // log.debug(`Retry onError #${_self.config.retryCount} next call.`);
            // resolve(setTimeoutPromise(_self.config.DELAY, new HTTPRetryRequest( _self.config, _self.URL, _self.options)));
          } else {
            log.debug(`onError #${_self.config.retryCount} reject.`);
            // no more tries, just reject
            reject(error);
          }
        })
        .on("data", chunk => (_self.buffer = Buffer.concat([_self.buffer, chunk])))
        .on("end", () => {
          log.debug(`Retry onEnd #${_self.config.retryCount} HTTP Status Code: ${innerStatusCode}`);
          if (_self.config.ERROR_CODES && _self.config.ERROR_CODES.test(innerStatusCode) && _self.config.retryCount <= _self.config.MAX_RETRIES) {
            if (!_self.config.IS_ERROR) {
              // Success branch and one of the status codes is found, resolve with success
              resolve({
                statusCode: innerStatusCode,
                body: _self.buffer
              });
              return; // exit to avoid next call
            }
            setTimeout(timeOutRetry, _self.config.DELAY, _self.config, _self.URL, _self.options, resolve);
            // TODO: replace after node version is above 15.0.0
            // log.debug(`Retry onEnd #${_self.config.retryCount} next call.`);
            // resolve(setTimeoutPromise(_self.config.DELAY, new HTTPRetryRequest( _self.config, _self.URL, _self.options)));
          } else {
            log.debug(`onEnd #${_self.config.retryCount} resolve.`);
            resolve({
              statusCode: innerStatusCode,
              body: _self.buffer
            });
          }
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
