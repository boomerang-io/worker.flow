const log = require("./log.js");
const properties = require("properties");
const config = require("./config");
const { workflowProps, inputOptions, outputOptions } = config;

//TODO Read in the 4 property files workflow.input workflow.system task.input and task.system
//Go through all task.input properties and resolve any <taskName.output.properties> by accessing the file

module.exports = {
  //TODO: implement
  substituteTaskInputValueForWFInputsPropertie(taskProp) { },

  /**
   * Substitute task props that have workflow property notation with corrsponding workflow props
   * @returns Object
   */
  async substituteTaskInputValuesForWFInputProperties() {
    log.debug("Inside substituteTaskInputValuesForWFInputProperties Utility");
    let inputProps;
    try {
      inputProps = await this.getInputProps();
      log.debug(inputProps);
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
    // log.debug("Inside getInputProps Utility");
    // return new Promise(function (resolve, reject) {
    //   properties.parse(`${workflowProps.WF_PROPS_PATH}/input.properties`, inputOptions, function (err, obj) {
    //     if (err) {
    //       reject(err);
    //     }
    //     resolve(obj);
    //   });
    // });

    //TODO return an object with the workflow and task properties

  },
  setOutputProperty(key, value) {
    log.debug("Inside setOutputProperty Utility");

    //TODO access the workflow and task system properties to build up a fetch

    fetch(
      "http://<properties.workflow.system.controllerUrl>/<properties.task.system.id>/property/set?key=<key>&value=<value>",
      {
        method: "PUT"
      }
    )
  },
  /**
   * Write exit code to properties file
   * @param code exit code from plugin execution
   * @returns Promise
   */
  setExitCode(code) {
    log.debug("Inside exitCode Utility");
    return new Promise(function (resolve, reject) {
      properties.stringify({ SYS_EXITCODE: code }, outputOptions, function (err, obj) {
        if (err) {
          reject(err);
        }
        resolve(obj);
      });
    });
  }
};
