const { NODE_ENV } = process.env;

const inputOptions = {
  path: true,
  namespaces: false,
  sections: false,
  variables: false,
  include: false
};
const workflowProps = {
  WF_PROPS_PATH:
    NODE_ENV === "local" || NODE_ENV === "test" ? "./props" : "/props",
  // We have two properties that are the same other than the Global regex flag
  // This is as regex.test(), if passed global, will not reset the index from word to word of our search
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test
  WF_PROPS_PATTERN: /\$\{p:([\w\ \.]*\/?[\w\.]+)\}/,
  WF_PROPS_PATTERN_GLOBAL: /\$\{p:([\w\ \.]*\/?[\w\.]+)\}/g
};

const outputOptions = {
  path: `${workflowProps.WF_PROPS_PATH}/output.properties`,
  unicode: true
};

const WORKFLOW_INPUT_PROPS_FILENAME = "workflow.input.properties";
const WORKFLOW_SYSTEM_PROPS_FILENAME = "workflow.system.properties";
const TASK_INPUT_PROPS_FILENAME =
  NODE_ENV === "test" ? "test.task.input.properties" : "task.input.properties";
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

module.exports = {
  inputOptions,
  workflowProps,
  outputOptions,
  PROPS_FILES_CONFIG
};
