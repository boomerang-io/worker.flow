// const utils = require("../utils.js");
var waitOn = require("wait-on");
const log = require("../log.js");
const properties = require("properties");
const fetch = require("node-fetch");
const fs = require("fs");

module.exports = {
  async wait() {
    /**
     * Wait for the lock to be removed by the controller service
     * This occurs when the worker-cntr completes
     */
    const lifecyclePath = "/lifecycle";
    const lifecycleFileLock = lifecyclePath + "/lock";
    const lifecycleFileEnv = lifecyclePath + "/env";
    var opts = {
      resources: [lifecycleFileLock],
      reverse: true,
      delay: 180,
      verbose: false
    };
    try {
      await waitOn(opts);
    } catch (err) {
      log.err(err);
      process.exit(1);
    }

    /**
     * Read the environment variables from custom task populated env file
     */
    const contents = fs.readFileSync(lifecycleFileEnv, "utf8");
    log.debug("  File: " + lifecycleFileEnv + " Original Content: " + contents);
    // Updated strict options for parsing multiline properties from textarea boxes.
    var parseOpts = {
      comments: "#",
      separators: "=",
      strict: true,
      reviver: function(key, value, section) {
        if (key != null && value == null) {
          return '""';
        } else {
          //Returns all the lines
          return this.assert();
        }
      }
    };
    var parsedProps = properties.parse(contents, parseOpts);
    log.debug("  Parsed Environment Output Properties: " + JSON.stringify(parsedProps));

    /**
     * Turn any files in the lifecycle folder (other than env) into properties
     * key: filename
     * property: base64 encoded contents
     */
    const lifecycleFiles = fs.readdirSync(lifecyclePath);
    const fileProps = lifecycleFiles
      .filter(file => file !== "env")
      .reduce((accum, file) => {
        const contents = fs.readFileSync(`/lifecycle/${file}`, "utf8");
        log.debug("  File: " + file + " Original Content: " + contents);
        const encodedProp = new Buffer(contents).toString("base64");
        log.debug("  File: " + file + " Encoded Content: ", encodedProp);
        accum[file] = encodedProp;
        return accum;
      }, {});
    log.debug("  Encoded File Output Properties: " + JSON.stringify(fileProps));

    // parsedProps += properties.parse(fileProps);
    joinedProps = { ...parsedProps, ...fileProps };
    log.debug("  All Parsed and Encoded Output Properties: " + JSON.stringify(joinedProps));
    await fetch(`http://bmrg-flow-services-controller/controller/properties/set?workflowId=${process.env.BMRG_WORKFLOW_ID}&workflowActivityId=${process.env.BMRG_ACTIVITY_ID}&taskId=${process.env.BMRG_TASK_ID}&taskName=${process.env.BMRG_TASK_NAME}`, {
      method: "patch",
      body: JSON.stringify(joinedProps),
      headers: { "Content-Type": "application/json" }
    })
      .then(res => log.debug(res))
      .catch(err => log.err("setOutputProperties", err));
  },
  async init() {
    fs.writeFileSync("/lifecycle/lock", "");
  }
};
