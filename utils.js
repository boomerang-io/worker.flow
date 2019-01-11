const log = require("./log.js");
const properties = require("properties");
const config = require("./config");
const { workflowProps, inputOptions, outputOptions, PROPS_FILES_CONFIG } = config;
//const axios = require("axios");
const fetch = require("node-fetch");
const Promise = require("bluebird");
const fs = require("fs");

/**
 * Use IFFE to enscapsulate properties
 */
module.exports = (function() {
  // Read in property files
  const files = fs.readdirSync(workflowProps.WF_PROPS_PATH);

  /**
   * Filter out files that don't match
   * Read in filtered files
   * Reduce to build up one object with all of the properties
   */

  const { PROPS_FILENAMES, INPUT_PROPS_FILENAME_PATTERN } = PROPS_FILES_CONFIG;
  const props = files
    .filter(file => PROPS_FILENAMES.includes(file) || INPUT_PROPS_FILENAME_PATTERN.test(file))
    .reduce((accum, file) => {
      const contents = fs.readFileSync(`${workflowProps.WF_PROPS_PATH}/${file}`, "utf8");
      const parsedProps = properties.parse(contents);
      accum[file] = parsedProps;
      return accum;
    }, {});

  log.debug(props);

  return {
    //TODO: implement
    substituteTaskInputValueForWFInputsPropertie(taskProp) {},
    /**
     * Substitute task props that have workflow property notation with corrsponding workflow props
     * @returns Object
     */
    substituteTaskInputPropsValuesForWorkflowInputProps() {
      log.debug("Inside substituteTaskInputPropsValuesForWorkflowInputProps Utility");

      const taskInputProps = props[PROPS_FILES_CONFIG.TASK_INPUT_PROPS_FILENAME];
      const workflowInputProps = props[PROPS_FILES_CONFIG.WORKFLOW_INPUT_PROPS_FILENAME];

      const substitutedTaskInputProps = Object.entries(taskInputProps)
        .filter(taskInputEntry => workflowProps.WF_PROPS_PATTERN.test(taskInputEntry[1])) //Test the value, and return arrays that match pattern
        .map(match => {
          const property = match[1].match(workflowProps.WF_PROPS_PATTERN)[1]; //Get value from entries array, find match for our property pattern, pull out first matching group

          //check for output.properties
          if (property.includes("/")) {
            const [taskName, prop] = property.split("/");
            match[1] = props[`${taskName}.output.properties`][prop];
          } else {
            match[1] = match[1].replace(
              workflowProps.WF_PROPS_PATTERN,
              workflowInputProps[`${workflowProps.WF_PROPS_PREFIX}${property}`]
            );
          }

          return match;
        })
        .reduce((accum, [k, v]) => {
          accum[k] = v;
          return accum;
        }, {});

      //Combine both w/ new values overwriting old ones
      const substitutedProps = { ...taskInputProps, ...substitutedTaskInputProps };
      return substitutedProps;
    },
    setOutputProperty(key, value) {
      log.debug("Inside setOutputProperty Utility");

      const { WORKFLOW_SYSTEM_PROPS_FILENAME, TASK_SYSTEM_PROPS_FILENAME } = PROPS_FILES_CONFIG;
      const workflowSystemProps = props[WORKFLOW_SYSTEM_PROPS_FILENAME];
      const taskSystemProps = props[TASK_SYSTEM_PROPS_FILENAME];

      return fetch(
        `http://${workflowSystemProps.controllerUrl}/${taskSystemProps.id}/property/set?key=${key}&value=${value}`,
        {
          method: "put"
        }
      )
        .then(res => log.debug(res))
        .catch(err => log.err("setOutputProperty", err));
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
})();
