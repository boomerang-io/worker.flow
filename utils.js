const log = require("./log.js");
const properties = require("properties");
const config = require("./config");
const { workflowProps, inputOptions, outputOptions } = config;

module.exports = {
  //TODO: implement
  substituteTaskInputValueForWFInputsPropertie(taskProp) {},

  /**
   * Substitute task props that have workflow property notation with corrsponding workflow props
   * @returns Object
   */
  async substituteTaskInputValuesForWFInputProperties() {
    log.debug("Inside substituteTaskInputValuesForWFInputProperties Utility");
    let inputProps;
    try {
      inputProps = await this.getInputProps();
    } catch (e) {
      log.warn(e);
    }

    const substitutedTaskInputs = Object.entries(inputProps)
      .filter(taskInputEntry => workflowProps.WF_PROPS_PATTERN.test(taskInputEntry[1])) //Test the value, and return arrays that match pattern
      .map(match => {
        const property = match[1].match(workflowProps.WF_PROPS_PATTERN)[1]; //Get value from entries array, find match for our property pattern, pull out first matching group
        match[1] = match[1].replace(
          workflowProps.WF_PROPS_PATTERN,
          inputProps[`${workflowProps.WF_PROPS_PREFIX}${property}`]
        );
        return match;
      })
      .reduce((accum, [k, v]) => {
        accum[k] = v;
        return accum;
      }, {});

    const substitutedProps = { ...inputProps, ...substitutedTaskInputs }; //Combine both w/ new values overwriting old ones
    return substitutedProps;
  },
  /**
   * Get props from properties file
   * @returns Promise
   */
  getInputProps() {
    log.debug("Inside getInputProps Utility");
    return new Promise(function(resolve, reject) {
      properties.parse(`${workflowProps.WF_PROPS_PATH}/input.properties`, inputOptions, function(err, obj) {
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
  /**
   * Write exit code to properties file
   * @param code exit code from plugin execution
   * @returns Promise
   */
  setExitCode(code) {
    log.debug("Inside exitCode Utility");
    return new Promise(function(resolve, reject) {
      properties.stringify({ SYS_EXITCODE: code }, outputOptions, function(err, obj) {
        if (err) {
          reject(err);
        }
        resolve(obj);
      });
    });
  }
};
