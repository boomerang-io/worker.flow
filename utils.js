const log = require("./log.js");
const properties = require("properties");
//const config = require("./config"); TODO

const WF_PROPS_PATH = "/props";
const WF_PROPS_PREFIX = "WFINPUTS_PROPS_";
const WF_PROPS_PATTERN = /\$\{p:(.+)\}/;

var inputOptions = {
  path: true,
  namespaces: false,
  sections: false,
  variables: false,
  include: false
};

var outputOptions = {
  path: WF_PROPS_PATH + "output.properties",
  unicode: true
};

module.exports = {
  //TODO: implement
  substituteTaskInputValueForWFInputsPropertie(taskProp) {},
  async substituteTaskInputValuesForWFInputProperties() {
    log.debug("Inside substituteTaskInputValuesForWFInputProperties Utility");
    let inputProps;
    try {
      inputProps = await this.getInputProps();
    } catch (e) {
      log.warn(e);
    }

    const substitutedTaskInputs = Object.entries(inputProps)
      .filter(taskInputEntry => WF_PROPS_PATTERN.test(taskInputEntry[1])) //Test the value, and return arrays that match pattern
      .map(match => {
        const property = match[1].match(WF_PROPS_PATTERN)[1]; //Get value from entries array, find match for our property pattern, pull out first matching group
        console.log(property);
        match[1] = match[1].replace(WF_PROPS_PATTERN, inputProps[`${WF_PROPS_PREFIX}${property}`]);
        return match;
      })
      .reduce((accum, [k, v]) => {
        accum[k] = v;
        return accum;
      }, {});

    const substitutedProps = { ...inputProps, ...substitutedTaskInputs }; //Combine both w/ new values overwriting old ones
    log.debug(substitutedProps);
    return substitutedProps;
  },
  getInputProps() {
    log.debug("Inside getInputProps Utility");
    return new Promise(function(resolve, reject) {
      properties.parse(`${WF_PROPS_PATH}/input.properties`, inputOptions, function(err, obj) {
        if (err) {
          reject(err);
        }
        resolve(obj);
      });
    });
  },
  output(props) {
    log.debug("Inside output Utility");
  },
  exitCode(code) {
    log.debug("Inside exitCode Utility");
    //process.env.OUTPUTS_PROPS_EXITCODE = code;
    properties.stringify({ SYS_EXITCODE: code }, outputOptions, function(err, obj) {
      if (err) {
        log.err(err);
        reject(err);
      }
    });
  }
};
