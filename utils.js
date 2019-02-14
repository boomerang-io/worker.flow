const log = require("./log.js");
const properties = require("properties");
const config = require("./config");
const {
  workflowProps,
  inputOptions,
  outputOptions,
  PROPS_FILES_CONFIG
} = config;
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
  log.debug("Property Files Found:", files);

  /**
   * Filter out files that don't match
   * Read in filtered files
   * Reduce to build up one object with all of the properties
   */

  const { PROPS_FILENAMES, INPUT_PROPS_FILENAME_PATTERN } = PROPS_FILES_CONFIG;
  const props = files
    .filter(
      file =>
        PROPS_FILENAMES.includes(file) ||
        INPUT_PROPS_FILENAME_PATTERN.test(file)
    )
    .reduce((accum, file) => {
      const contents = fs.readFileSync(
        `${workflowProps.WF_PROPS_PATH}/${file}`,
        "utf8"
      );
      const parsedProps = properties.parse(contents);
      accum[file] = parsedProps;
      return accum;
    }, {});

  log.debug(props);

  return {
    //TODO: implement
    substituteTaskInputValueForWFInputsProperty(taskProp) {},
    /**
     * Substitute task props that have workflow property notation with corrsponding workflow props
     * @returns Object
     */
    substituteTaskInputPropsValuesForWorkflowInputProps() {
      //log.debug("Inside substituteTaskInputPropsValuesForWorkflowInputProps Utility");

      const taskInputProps =
        props[PROPS_FILES_CONFIG.TASK_INPUT_PROPS_FILENAME];
      const workflowInputProps =
        props[PROPS_FILES_CONFIG.WORKFLOW_INPUT_PROPS_FILENAME];
      //log.debug(taskInputProps);
      const substitutedTaskInputProps = Object.entries(taskInputProps)
        .filter(taskInputEntry =>
          workflowProps.WF_PROPS_PATTERN.test(taskInputEntry[1])
        ) //Test the value, and return arrays that match pattern
        .map(match => {
          log.debug("Task property found requiring substitutions:", match);
          const properties = match[1].match(workflowProps.WF_PROPS_PATTERN); //Get value from entries array, find match for our property pattern, pull out first matching group
          log.debug("Property references in match:", properties);

          for (var property of properties) {
            //TODO use original regex for capture group of key
            var propertyKey = property.replace("${p:", "").replace("}", "");
            var protectedProperty = false;
            //TODO update this. Workflow System and Input properties might conflict
            if (property.includes("workflow/controller.service.url")) {
              //TODO properly detect a list of protected properties
              replacementStr = "";
              protectedProperty = true;
            } else if (property.includes("workflow/")) {
              const [key, prop] = propertyKey.split("/");
              replacementStr = props[`workflow.system.properties`][prop];
            } else if (property.includes("task/")) {
              const [key, prop] = propertyKey.split("/");
              replacementStr = props[`task.system.properties`][prop];
            } else if (property.includes("/")) {
              const [key, prop] = propertyKey.split("/");
              replacementStr =
                props[`${key.replace(/\s+/g, "")}.output.properties`][prop];
            } else {
              replacementStr = workflowInputProps[`${propertyKey}`]
                ? workflowInputProps[`${propertyKey}`]
                : "";
            }
            if (!replacementStr) {
              protectedProperty
                ? log.warn("Protected property:", property)
                : log.warn("Undefined property:", property);
            } else {
              log.debug(
                "Replacing proeprty:",
                property,
                "with:",
                replacementStr
              );
              match[1] = match[1].replace(property, replacementStr);
            }
          }
          return match;
        })
        .reduce((accum, [k, v]) => {
          accum[k] = v;
          return accum;
        }, {});

      //Combine both w/ new values overwriting old ones
      const substitutedProps = {
        ...taskInputProps,
        ...substitutedTaskInputProps
      };
      return substitutedProps;
    },
    getWorkflowSystemProperty(key) {
      const { WORKFLOW_SYSTEM_PROPS_FILENAME } = PROPS_FILES_CONFIG;
      const workflowSystemProps = props[WORKFLOW_SYSTEM_PROPS_FILENAME];
      return workflowSystemProps[key];
    },
    setOutputProperty(key, value) {
      log.debug("Inside setOutputProperty Utility");

      // Call internal method
      // To set a object key using a variable it needs to be between [] (computed property)
      // "this." is necessary in order to call a different function of this module
      this.setOutputProperties({ [key]: value });
    },
    setOutputProperties(properties) {
      log.debug("Inside setOutputProperties Utility");

      //Validation that properties is in fact an array of key values
      try {
        if (!(Object.keys(properties) && typeof properties === "object")) {
          log.warn("Properties variable isn't a valid object");
          return;
        }
      } catch (error) {
        log.warn(error);
        return;
      }

      log.debug("  properties: ", JSON.stringify(properties));

      const {
        WORKFLOW_SYSTEM_PROPS_FILENAME,
        TASK_SYSTEM_PROPS_FILENAME
      } = PROPS_FILES_CONFIG;
      const workflowSystemProps = props[WORKFLOW_SYSTEM_PROPS_FILENAME];
      const taskSystemProps = props[TASK_SYSTEM_PROPS_FILENAME];
      const controllerUrl = workflowSystemProps["controller.service.url"];
      const workflowId = workflowSystemProps["workflow.id"];
      const activityId = workflowSystemProps["activity.id"];
      const taskId = taskSystemProps["task.id"];
      const taskName = taskSystemProps["task.name"].replace(/\s+/g, "");

      //log.debug("  url: ", `http://${controllerUrl}/controller/properties/set?workflowId=${workflowId}&workflowActivityId=${activityId}&taskId=${taskId}&taskName=${taskName}`);
      return fetch(
        `http://${controllerUrl}/controller/properties/set?workflowId=${workflowId}&workflowActivityId=${activityId}&taskId=${taskId}&taskName=${taskName}`,
        {
          method: "patch",
          body: JSON.stringify(properties),
          headers: { "Content-Type": "application/json" }
        }
      )
        .then(res => log.debug(res))
        .catch(err => log.err("setOutputProperties", err));
    }
  };
})();
