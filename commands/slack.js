const HttpsProxyAgent = require("https-proxy-agent");
const { IncomingWebhook } = require("@slack/webhook");
const { WebClient } = require("@slack/web-api");
const datetime = require("node-datetime");
const log = require("./../log.js");
const utils = require("../utils.js");

// Internal Helper Functions
async function ContentChunker(content, limit) {
  const contentByLines = content.split("\n");
  log.debug("Content by lines:", contentByLines);
  var limitIter = 0;
  var chunkIter = 0;
  var contentChunks = [];

  var tempLine = "";
  contentByLines.forEach(line => {
    if (line.length != 0) {
      if (limitIter + line.length < limit) {
        tempLine += line + "\n";
        limitIter += tempLine.length;
      } else if (limitIter + line.length > limit) {
        tempLines = line.split(char[2999]);
        chunkIter++;
        tempLines.forEach(l => {
          contentChunks[chunkIter] = l;
          chunkIter++;
        });
      } else {
        chunkIter++;
        tempLine = line + "\n";
        limitIter = tempLine.length;
      }
      contentChunks[chunkIter] = tempLine;
    }
  });

  log.debug("Content by chunks:", contentChunks);
  return contentChunks;
}

// Available Task Functions
module.exports = {
  async sendSimpleMessage() {
    log.debug("Inside Send Simple Slack Webhook Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { url, channel, username, message, icon } = taskProps;

    //Variable Checks
    if (!url) {
      log.err("URL has not been set");
      process.exit(1);
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

    payload = {
      channel: channel,
      username: username,
      icon_emoji: icon,
      text: message,
      ts: datetime.create().epoch()
    };
    if (!channel || channel === '""') {
      log.warn("Channel or user has not been set. Leaving empty to default to the channel or user configured as part of the webhook.");
      delete payload.channel;
    }
    log.debug("Payload:", payload);
    await webhook.send(payload, function(err, res) {
      if (err) {
        /** @todo Catch HTTP error for timeout so we can return better exits */
        log.err("Slack sendWebhook error", err);
        process.exit(1);
      } else {
        log.good("Message sent: " + res.text);
      }
    });
  },
  async sendRichMessage() {
    log.debug("Inside Send Rich Slack Webhook Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { url, channel, username, fallback, blocks, icon } = taskProps;

    //Variable Checks
    if (!url) {
      log.err("URL has not been set");
      process.exit(1);
    }
    if (!channel) {
      log.err("Channel or user has not been set");
      process.exit(1);
    }
    if (!username) {
      log.debug("Setting default username to Boomerang Joe");
      username == "Boomerang Joe";
    }
    if (!icon) {
      log.debug("Setting default icon to :boomerang:");
      icon == ":boomerang:";
    }

    let webhook = new IncomingWebhook(url);

    /** @todo see if we can set the proxy at the higher CLI level rather than have each plugin have to support a proxy*/
    if (process.env.HTTP_PROXY) {
      log.debug("Using Proxy", process.env.HTTP_PROXY);
      webhook = new IncomingWebhook(url, {
        agent: new HttpsProxyAgent(process.env.HTTP_PROXY)
      });
    }

    payload = {
      channel: channel,
      username: username,
      icon_emoji: icon,
      ts: datetime.create().epoch(),
      text: fallback,
      blocks: JSON.parse(blocks)
    };
    log.debug("Payload:", payload);
    await webhook.send(payload, function(err, res) {
      if (err) {
        /** @todo Catch HTTP error for timeout so we can return better exits */
        log.err("Slack sendWebhook error", err);
        process.exit(1);
      } else {
        log.good("Message sent: " + res.text);
      }
    });
  },
  async sendCustomMessage() {
    log.debug("Inside Send Custom Slack Webhook Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { url, message } = taskProps;

    //Variable Checks
    if (!url) {
      log.err("URL has not been set");
      process.exit(1);
    }
    if (!message) {
      log.err("Message Payload has not been set");
      process.exit(1);
    }

    let webhook = new IncomingWebhook(url);

    /** @todo see if we can set the proxy at the higher CLI level rather than have each plugin have to support a proxy*/
    if (process.env.HTTP_PROXY) {
      log.debug("Using Proxy", process.env.HTTP_PROXY);
      webhook = new IncomingWebhook(url, {
        agent: new HttpsProxyAgent(process.env.HTTP_PROXY)
      });
    }

    payload = JSON.parse(message);
    log.debug("Payload:", payload);
    await webhook.send(payload, function(err, res) {
      if (err) {
        /** @todo Catch HTTP error for timeout so we can return better exits */
        log.err("Slack sendWebhook error", err);
        process.exit(1);
      } else {
        log.good("Message sent: " + res.text);
      }
    });
  },
  async sendFileMessage() {
    log.debug("Inside Send Log Slack Webhook Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { url, channel, icon, username, message, content, encoded, context } = taskProps;

    //Variable Checks
    if (!url) {
      log.err("URL has not been set");
      process.exit(1);
    }
    if (!username) {
      log.debug("Setting default username to Boomerang Joe");
      username == "Boomerang Joe";
    }
    if (!icon) {
      log.debug("Setting default icon to :boomerang:");
      icon == ":boomerang:";
    }
    var contentDecoded;
    if (!encoded || encoded !== true) {
      contentDecoded = content;
    } else {
      log.debug("Decoding log content...");
      contentDecoded = Buffer.from(content, "base64").toString("utf-8");
    }

    let webhook = new IncomingWebhook(url);

    /** @todo see if we can set the proxy at the higher CLI level rather than have each plugin have to support a proxy*/
    if (process.env.HTTP_PROXY) {
      log.debug("Using Proxy", process.env.HTTP_PROXY);
      webhook = new IncomingWebhook(url, {
        agent: new HttpsProxyAgent(process.env.HTTP_PROXY)
      });
    }

    // Need to break content up as Slack has a 3000 character limit on each block
    var chunkedContent = await ContentChunker(contentDecoded, 3000);
    var blocks = [];
    blocks.push(
      {
        type: "section",
        text: {
          type: "plain_text",
          text: message
        }
      },
      {
        type: "divider"
      }
    );
    chunkedContent.forEach(chunk =>
      blocks.push({
        type: "section",
        text: {
          type: "plain_text",
          text: chunk
        }
      })
    );
    blocks.push(
      {
        type: "divider"
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: context
          }
        ]
      }
    );

    payload = {
      channel: channel,
      username: username,
      icon_emoji: icon,
      ts: datetime.create().epoch(),
      text: message,
      blocks: blocks
    };
    if (!channel || channel === '""') {
      log.warn("Channel or user has not been set. Leaving empty to default to the channel or user configured as part of the webhook.");
      delete payload.channel;
    }
    log.debug("Payload:", payload);
    await webhook.send(payload, function(err, res) {
      if (err) {
        /** @todo Catch HTTP error for timeout so we can return better exits */
        log.err("Slack upload file error", err);
        process.exit(1);
      } else {
        log.good("Message sent: " + res.text);
      }
    });
  },
  async uploadFileMessage() {
    log.debug("Inside Send File Slack Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { token, channel, username, icon, message, encoded, fileName, fileContent } = taskProps;

    //Variable Checks
    if (!token) {
      log.err("Token has not been set");
      process.exit(1);
    }
    if (!username) {
      log.debug("Setting default username to Boomerang Joe");
      username == "Boomerang Joe";
    }
    if (!icon) {
      log.debug("Setting default icon to :boomerang:");
      icon == ":boomerang:";
    }
    var fileContentDecoded;
    if (!encoded || encoded !== true) {
      fileContentDecoded = fileContent;
    } else {
      log.debug("Decoding log content...");
      fileContentDecoded = Buffer.from(fileContent, "base64").toString("utf-8");
    }

    var web = new WebClient(token);
    if (process.env.HTTP_PROXY) {
      log.debug("Using Proxy", process.env.HTTP_PROXY);
      web = new WebClient(token, { agent: new HttpsProxyAgent(process.env.HTTP_PROXY) });
    }

    try {
      const response = await web.files.upload({
        filename: fileName,
        content: fileContentDecoded,
        channels: channel,
        initial_comment: message,
        title: "File"
      });
      log.debug(response);
    } catch (error) {
      log.err("Well, that was unexpected.", error);
    }
  },
  async lookUpUser() {
    log.debug("Inside Look Up User Slack Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { token, emailAddress } = taskProps;

    //Variable Checks
    if (!token) {
      log.err("Token has not been set");
      process.exit(1);
    }
    if (!emailAddress) {
      log.err("Email address has not been specified");
      process.exit(1);
    }

    var web = new WebClient(token);
    if (process.env.HTTP_PROXY) {
      log.debug("Using Proxy", process.env.HTTP_PROXY);
      web = new WebClient(token, { agent: new HttpsProxyAgent(process.env.HTTP_PROXY) });
    }

    await web.users
      .lookupByEmail({
        email: emailAddress
      })
      .then(body => {
        log.debug("Response Received:", JSON.stringify(body));
        const user_id = body.user.id;
        log.sys("slackUserId Found:", user_id);
        utils.setOutputProperty("slackUserId", user_id);
        log.good("Response successfully received!");
      })
      .catch(err => {
        log.err(err);
        process.exit(1);
      });
  }
};
