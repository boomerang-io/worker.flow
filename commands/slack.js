const HttpsProxyAgent = require("https-proxy-agent");
const { IncomingWebhook } = require("@slack/client");
const https = require("https");
const datetime = require("node-datetime");
const log = require("./../log.js");

module.exports = {
  sendWebhook(req) {
    log.debug("Inside Send Slack Webhook Plugin");

    const url =
      "***REMOVED***";
    var webhook = new IncomingWebhook(url);

    //TODO: see if we can set the proxy at the higher CLI level rather than have each plugin have to support a proxy
    if (process.env.HTTP_PROXY) {
      log.debug("Using Proxy", process.env.HTTP_PROXY);
      webhook = new IncomingWebhook(url, {
        agent: new HttpsProxyAgent(process.env.HTTP_PROXY)
      });
    }


    //TODO: Finish variable check
    if (req.channel === '') {
      log.err("Channel or user has not been set");
      process.exit(1);
    }

    // Send simple text to the webhook channel
    webhook.send(
      {
        channel: req.channel,
        text: "This is a test from the flow container",
        attachments: [
          {
            fallback: "This is a test.",
            color: "#36a64f",
            title: req.title,
            text: req.message,
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
          process.exit(1);
        } else {
          log.good("Message sent: " + res.text);
        }
      }
    );
  }
};
