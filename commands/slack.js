const HttpsProxyAgent = require("https-proxy-agent");
const { IncomingWebhook } = require("@slack/client");
const https = require("https");
const datetime = require("node-datetime");
const log = require("./../log.js");
const utils = require("../utils.js");

module.exports = {
  async sendSimpleMessage() {
    log.debug("Inside Send Simple Slack Webhook Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { url, channel, username, message, icon } = taskProps;

    //Variable Checks
    if (!url) {
      log.err("URL has not been set");
      return process.exit(1);
    }
    if (!channel) {
      log.err("Channel or user has not been set");
      return process.exit(1);
    }
    if (!username) {
      log.debug("Setting default username to Boomerang Joe");
      username == "Boomerang Joe";
    }
    if (!icon) {
      log.debug("Setting default icon to :boomerang:");
      icon == ":boomerang:";
    }

    // const url = "***REMOVED***";
    let webhook = new IncomingWebhook(url);

    /** @todo see if we can set the proxy at the higher CLI level rather than have each plugin have to support a proxy*/
    if (process.env.HTTP_PROXY) {
      log.debug("Using Proxy", process.env.HTTP_PROXY);
      webhook = new IncomingWebhook(url, {
        agent: new HttpsProxyAgent(process.env.HTTP_PROXY)
      });
    }

    // Send simple text to the webhook channel
    return webhook.send(
      {
        channel: channel,
        username: username,
        icon_emoji: icon,
        text: JSON.stringify(message),
      },
      async function (err, res) {
        if (err) {
          /** @todo Catch HTTP error for timeout so we can return better exits */
          log.err("Slack sendWebhook error", err);
          return process.exit(1);
        } else {
          log.good("Message sent: " + res.text);
        }
      }
    );
  },
  async sendRichMessage() {
    log.debug("Inside Send Rich Slack Webhook Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { url, channel, username, message, icon } = taskProps;

    /** @todo Implement a variable check */
    if (!url) {
      log.debug(url);
      log.err("URL has not been set");
      return process.exit(1);
    }
    if (!channel) {
      log.debug(channel);
      log.err("Channel or user has not been set");
      return process.exit(1);
    }

    // const url = "***REMOVED***";
    let webhook = new IncomingWebhook(url);

    /** @todo see if we can set the proxy at the higher CLI level rather than have each plugin have to support a proxy*/
    if (process.env.HTTP_PROXY) {
      log.debug("Using Proxy", process.env.HTTP_PROXY);
      webhook = new IncomingWebhook(url, {
        agent: new HttpsProxyAgent(process.env.HTTP_PROXY)
      });
    }

    //Variable Checks
    if (!url) {
      log.err("URL has not been set");
      return process.exit(1);
    }
    if (!channel) {
      log.err("Channel or user has not been set");
      return process.exit(1);
    }
    if (!username) {
      log.debug("Setting default username to Boomerang Joe");
      username == "Boomerang Joe";
    }
    if (!icon) {
      log.debug("Setting default icon to :boomerang:");
      icon == ":boomerang:";
    }

    // Send simple text to the webhook channel
    return webhook.send(
      {
        channel: channel,
        username: username,
        icon_emoji: icon,
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
          /** @todo Catch HTTP error for timeout so we can return better exits */
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
