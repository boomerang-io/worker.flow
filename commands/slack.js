const HttpsProxyAgent = require("https-proxy-agent");
const { IncomingWebhook } = require("@slack/client");
const https = require("https");
const datetime = require("node-datetime");
const log = require("./../log.js");
const utils = require("../utils.js");

// TODO:
// get properties, validation, etc.
//const properties = utils.getProperties({key: "channel", validation: validator.isEmail, "message", "title");

module.exports = {
  async sendWebhook() {
    log.debug("Inside Send Slack Webhook Plugin");

    let stepProps;
    try {
      stepProps = await utils.substituteTaskInputsValuesForWFInputsProperties();
    } catch (e) {
      log.error(e);
    }

    //Destructure and rename stepProps
    const {
      TASK_PROPS_CHANNEL: channel,
      TASK_PROPS_TITLE: title,
      TASK_PROPS_MESSAGE: message
    } = stepProps;

    const url = "***REMOVED***";
    const webhook = new IncomingWebhook(url);

    //TODO: see if we can set the proxy at the higher CLI level rather than have each plugin have to support a proxy
    if (process.env.HTTP_PROXY) {
      log.debug("Using Proxy", process.env.HTTP_PROXY);
      webhook = new IncomingWebhook(url, {
        agent: new HttpsProxyAgent(process.env.HTTP_PROXY)
      });
    }

    //TODO: Finish variable check
    if (!channel) {
      log.debug(channel);
      log.err("Channel or user has not been set");
      utils.exitCode(1);
      return process.exit(0);
    }

    // Send simple text to the webhook channel
    webhook.send(
      {
        channel: channel,
        text: "This is a test from the flow container",
        attachments: [
          {
            fallback: "This is a test.",
            color: "#36a64f",
            title: title,
            text: message,
            image_url: "http://my-website.com/path/to/image.jpg",
            thumb_url: "http://example.com/path/to/thumb.png",
            footer: "Boomerang Flow",
            ts: datetime.create().epoch()
          }
        ]
      },
      function (err, res) {
        if (err) {
          //TODO: Catch HTTP error for timeout so we can return better exits
          log.err(err);
          utils.exitCode(1); //send error to output props
          process.exit(0); //container exits okay
        } else {
          log.good("Message sent: " + res.text);
          utils.exitCode(0);
          process.exit(0);
        }
      }
    );
  }
};
