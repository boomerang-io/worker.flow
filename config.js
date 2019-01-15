const inputOptions = {
  path: true,
  namespaces: false,
  sections: false,
  variables: false,
  include: false
};

const workflowProps = {
  WF_PROPS_PATH: "./props",
  WF_PROPS_PREFIX: "WF_PROPS_",
  WF_PROPS_PATTERN: /\$\{p:(.+)\}/
};

const outputOptions = {
  path: `${workflowProps.WF_PROPS_PATH}/output.properties`,
  unicode: true
};

const WORKFLOW_INPUT_PROPS_FILENAME = "workflow.input.properties";
const WORKFLOW_SYSTEM_PROPS_FILENAME = "workflow.system.properties";
const TASK_INPUT_PROPS_FILENAME = "task.input.properties";
const TASK_SYSTEM_PROPS_FILENAME = "task.system.properties";

const PROPS_FILES_CONFIG = {
  WORKFLOW_INPUT_PROPS_FILENAME,
  WORKFLOW_SYSTEM_PROPS_FILENAME,
  TASK_INPUT_PROPS_FILENAME,
  TASK_SYSTEM_PROPS_FILENAME,
  PROPS_FILENAMES: [
    WORKFLOW_INPUT_PROPS_FILENAME,
    WORKFLOW_SYSTEM_PROPS_FILENAME,
    TASK_INPUT_PROPS_FILENAME,
    TASK_SYSTEM_PROPS_FILENAME
  ],
  INPUT_PROPS_FILENAME_PATTERN: /^.+\.output\.properties$/
};

module.exports = { inputOptions, workflowProps, outputOptions, PROPS_FILES_CONFIG };
