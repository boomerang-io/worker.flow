const utils = require("../utils.js");
var waitOn = require("wait-on");
const log = require("../log.js");
const properties = require("properties");
const fetch = require("node-fetch");
const fs = require("fs");

module.exports = {
  async wait() {
    var opts = {
      resources: ["/lifecycle/lock"],
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

    const file = "/lifecycle/env";
    const contents = fs.readFileSync(file, "utf8");
    log.debug("  File: " + file + " Original Content: " + contents);
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
    const parsedProps = properties.parse(contents, parseOpts);
    log.debug("  File: " + file + " Parsed Content: " + parsedProps);
    await utils.setOutputProperties(parsedProps);
  },
  async init() {
    fs.writeFileSync("/lifecycle/lock", "");
  },
  async terminate() {
    const file = "/lifecycle/env";
    const contents = fs.readFileSync(file, "utf8");
    log.debug("  File: " + file + " Original Content: " + contents);
    // Updated strict options for parsing multiline properties from textarea boxes.
    var options = {
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
    const parsedProps = properties.parse(contents, options);
    log.debug("  File: " + file + " Original Content: " + contents);
    // this.setOutputProperties(parsedProps);
    return fetch(`http://bmrg-flow-services-controller/controller/properties/set?workflowId=' + process.env.BMRG_WORKFLOW_ID + '&workflowActivityId=' + process.env.BMRG_ACTIVITY_ID + '&taskId=' + process.env.BMRG_TAKE_ID + '&taskName=' + process.env.BMRG_TASK_NAME`, {
      method: "patch",
      body: JSON.stringify(parsedProps),
      headers: { "Content-Type": "application/json" }
    })
      .then(res => log.debug(res))
      .catch(err => log.err("setOutputProperties", err));
  }
};
