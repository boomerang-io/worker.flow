const https = require("https");

let DEFAULTS = {
  MAX_RETRIES: 5,
  ERROR_CODES: ""
};

function HTTPRetryRequest(config, options) {
  let _self = this;
  _self.options = options;
  _self.config = { ...DEFAULTS, ...config }; // overwrite defaults

  if (_self.config.ERROR_CODES && _self.config.ERROR_CODES.length) {
    // create pattern of /(5\d\d|4\d\d|9\d\d)/
    _self.config.ERROR_CODES = _self.config.ERROR_CODES.replaceAll(",", "|"); // replace sperator , with | for regex
    _self.config.ERROR_CODES = _self.config.ERROR_CODES.toUpperCase(); // make uppercase (x -> X)
    _self.config.ERROR_CODES = _self.config.ERROR_CODES.replaceAll("X", "\\d"); // replace character X with \d for regex - represents a digit
    _self.config.ERROR_CODES = new RegExp("(" + _self.config.ERROR_CODES + ")"); // wrap in () to have the alternative
  }
  if (!_self.config.retryCount) {
    _self.config.retryCount = 1;
  } else {
    _self.config.retryCount++;
  }
  _self.buffer = Buffer.alloc(0);

  return new Promise((resolve, reject) => {
    let requestInstance = https.request(options, response => {
      const innerStatusCode = response.statusCode.toString();
      const responseInstance = response
        .on("error", error => {
          responseInstance.abort();
          if (_self.config.ERROR_CODES && _self.config.ERROR_CODES.test(innerStatusCode) && _self.config.retryCount < _self.config.MAX_RETRIES) {
            // if the status is one of the ones we want to retry, then make the same request
            resolve(new HTTPRetryRequest(_self.config, _self.options));
          } else {
            // no more tries, just reject
            reject(error);
          }
        })
        .on("data", chunk => Buffer.concat([_self.buffer, chunk]))
        .on("end", () => {
          if (_self.config.ERROR_CODES && _self.config.ERROR_CODES.test(innerStatusCode) && _self.config.retryCount < _self.config.MAX_RETRIES) {
            resolve(new HTTPRetryRequest(_self.config, _self.options));
          } else {
            resolve({
              statusCode: innerStatusCode,
              body: _self.buffer
            });
          }
        });
    });
    requestInstance.on("error", err => {
      // other type of error prior to response
      reject(err);
    });
    if (_self.config.body && _self.config.body.trim()) {
      requestInstance.write(_self.config.body.trim());
    }
    requestInstance.end();
  });
}

module.exports = HTTPRetryRequest;
