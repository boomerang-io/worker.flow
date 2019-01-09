const log = require("./log.js");
const properties = require("properties");
var fs = require("fs");

var inputOptions = {
  path: true,
  namespaces: false,
  sections: false,
  variables: true,
  include: false
};

var outputOptions = {
  path: "./props/output.properties",
  unicode: true
};

const WF_PROPS_PREFIX = "WFINPUTS_PROPS_";
const WF_PROPS_PATTERN = /\$\{p:(.+)\}/;

module.exports = {
  //TODO: implement
  substituteTaskInputValueForWFInputsPropertie(taskProp) {},
  async substituteTaskInputsValuesForWFInputsProperties() {
    let inputProps;
    try {
      inputProps = await this.getInputProps();
    } catch (e) {
      log.warn(e);
    }
    console.log(inputProps);
    const substitutedTaskInputs = Object.entries(process.env)
      .filter(taskInputEntry => WF_PROPS_PATTERN.test(taskInputEntry[1])) //Test the value, and return arrays that match pattern
      .map(match => {
        const property = match[1].match(WF_PROPS_PATTERN)[1]; //Get value from entries array, find match for our property pattern, pull out first matching group
        match[1] = match[1].replace(WF_PROPS_PATTERN, inputProps[`${WF_PROPS_PREFIX}${property}`]);
        return match;
      })
      .reduce((accum, [k, v]) => {
        accum[k] = v;
        return accum;
      }, {});

    const newProps = { ...process.env, ...substitutedTaskInputs }; //Combine both w/ new values overwriting old ones
    console.log(newProps);
    return newProps;
  },
  getInputProps() {
    return new Promise(function(resolve, reject) {
      properties.parse("./props/input.properties", inputOptions, function(err, obj) {
        if (err) {
          reject(err);
        }
        resolve(obj);
      });
    });
  },
  output(props) {
    log.debug("Inside Properties Output Utility");
  },
  exitCode(code) {
    log.debug("Inside Properties ExitCode Utility");
    //process.env.OUTPUTS_PROPS_EXITCODE = code;
    properties.stringify({ exitCode: code }, outputOptions, function(err, obj) {
      if (err) {
        log.err(err);
        reject(err);
      }
    });
  }
};
