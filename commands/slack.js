const HttpsProxyAgent = require("https-proxy-agent");
const { IncomingWebhook } = require("@slack/client");
const https = require("https");
const datetime = require("node-datetime");
const log = require("./../log.js");
const utils = require("../utils.js");

module.exports = {
  async sendWebhook() {
    log.debug("Inside Send Slack Webhook Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    log.debug(taskProps);
    const { channel: channel, title: title, message: message } = taskProps;

    const url = "***REMOVED***";
    let webhook = new IncomingWebhook(url);

    //TODO: see if we can set the proxy at the higher CLI level rather than have each plugin have to support a proxy
    if (process.env.HTTP_PROXY) {
      log.debug("Using Proxy", process.env.HTTP_PROXY);
      webhook = new IncomingWebhook(url, {
        agent: new HttpsProxyAgent(process.env.HTTP_PROXY)
      });
    }

    //TODO: Implement a variable check
    if (!channel) {
      log.debug(channel);
      log.err("Channel or user has not been set");
      return process.exit(1);
    }

    // Send simple text to the webhook channel
    return webhook.send(
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
      async function (err, res) {
        if (err) {
          //TODO: Catch HTTP error for timeout so we can return better exits
          log.err("Slack sendWebhook error", err);
          return process.exit(1);
        } else {
          log.good("Message sent: " + res.text);
          try {
            await utils.setOutputProperty("this", "that");
          } catch (err) {
            log.err(err);
          }
        }
      }
    );
  }
};
