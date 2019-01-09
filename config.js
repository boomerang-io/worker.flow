exports.default = {
  inputOptions: {
    path: true,
    namespaces: false,
    sections: false,
    variables: false,
    include: false
  },
  outputOptions: {
    path: "output.properties",
    unicode: true
  },
  workflowProps: {
    WF_PROPS_PATH: "/props",
    WF_PROPS_PREFIX: "WFINPUTS_PROPS_",
    WF_PROPS_PATTERN: /\$\{p:(.+)\}/
  }
};
