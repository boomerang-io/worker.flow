const HttpsProxyAgent = require("https-proxy-agent");
const { IncomingWebhook } = require("@slack/client");
const https = require("https");
const datetime = require("node-datetime");
const log = require("../log.js");
const utils = require("../utils.js");

module.exports = {
  execute() {
    log.debug("Inside Shell Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    log.debug(taskProps);
    const { channel: channel, title: title, message: message } = taskProps;

    shell.exec('curl -T ' + req.filePath + ' https://tools.boomerangplatform.net/artifactory/boomerang/test' + req.filePath + ' --insecure -u admin:WwwWulaWwHH!');

    log.debug("End Shell Plugin");
  }
};
