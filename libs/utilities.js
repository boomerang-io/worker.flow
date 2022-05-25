const { log } = require("@boomerang-io/worker-core");

module.exports = (function() {
  return {
    HEADERS: {
      CONTENTTYPE: "Content-Type",
      CONTENTLENGTH: "Content-Length"
    },

    HEADERVALUES: {
      APPLICATIONJSON: "application/json",
      APPLICATIONXML: "application/xml",
      TEXTHTML: "text/html"
    },

    /**
     * Check if param is set or not, in case of mandatory inputs
     * @param {*} input - if the string is empty, we want to pass it as undefined to the api
     *
     */
    checkIfEmpty: function(input) {
      if (!input || (typeof input === "string" && (input === '""' || input === '" "'))) {
        return true;
      }
      return false;
    },

    /**
     * Removes every property from object, with the name 'fieldName'
     * @param {object} object
     * @param {string} fieldName
     */
    unsetField: function(object, fieldName) {
      Object.keys(object).forEach(key => {
        // recursive call
        if (object[key] && object[key] instanceof Object && Object.keys(object[key]).length) {
          module.exports.unsetField(object[key], fieldName);
        } else {
          if (key === fieldName) {
            delete object[key];
          }
        }
      });
    },

    /**
     * Validates all attributes of the supplied object. Returns true if all parameters are valid.
     * @param {object} params
     */
    checkParameters: function(params) {
      let invalidParams = Object.entries(params).filter(([key, value]) => module.exports.checkIfEmpty(value));
      invalidParams.forEach(([key, value]) => log.warn(`The parameter '${key}' is not defined or empty`));
      return invalidParams.length;
    },

    /**
     * Try to check if valid JSON and convert it to JS Object.
     * Attention: hard exit on failure.
     *
     * @param {string} input - check to see if the parameter is not empty, then parse before sending to API
     *
     */
    checkForJson: function(input) {
      if (!module.exports.checkIfEmpty(input)) {
        try {
          return JSON.parse(input);
        } catch (err) {
          log.err("JSON was unable to be parsed");
          process.exit(1);
        }
      }
      return false;
    },

    /**
     * Try to check if valid JSON and convert it to JS Object.
     *
     * @param {string} input - check to see if the parameter is not empty, then parse before sending to API
     *
     */
    isValidJson: function(input) {
      if (!module.exports.checkIfEmpty(input)) {
        try {
          return JSON.parse(input);
        } catch (err) {
          return false;
        }
      }
      return false;
    }
  };
})();
