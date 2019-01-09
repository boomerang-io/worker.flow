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

module.exports = { inputOptions, workflowProps, outputOptions };
