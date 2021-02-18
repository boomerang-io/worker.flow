const { log, utils } = require("@boomerang-io/worker-core");
const HttpsProxyAgent = require("https-proxy-agent");
const filePath = require("path");
const fs = require("fs");
const client = require("@sendgrid/client");

/**
 *
 * @param {} input - if the string is empty, we want to pass it as undefined to the api
 *
 */
function protectAgainstEmpty(input) {
  if (input && typeof input === "string" && input === '""') {
    return undefined;
  }
  return input;
}

/**
 *
 * @param {} input - check to see if the parameter is not empty, then parse before sending to API
 *
 */
function checkForJson(input) {
  if (input && typeof input === "string" && input !== '""') {
    try {
      return JSON.parse(input);
    } catch (err) {
      log.err("JSON was unable to be parsed");
      process.exit(1);
    }
  }
  return undefined;
}

function splitStrToObjects(str) {
  if (!str || typeof str !== "string" || str === '""') {
    return undefined;
  }

  if (str && typeof str === "string" && str.includes(",")) {
    let strArr = str.split(",");
    let temp = strArr.map(strEmail => {
      return { email: strEmail };
    });
    return temp;
  }
  return [{ email: str }];
}
/**
 * -create content for the data body of the sendgrid mail client API call
 * takes in html and/or text content to be sent in the email
 * @param {*} text
 * @param {*} html
 */
function createContent(text, html) {
  if (!protectAgainstEmpty(text) && !protectAgainstEmpty(html)) {
    return null;
  }
  let output = [];
  if (protectAgainstEmpty(text)) {
    output.push({
      type: "text",
      value: text
    });
  }
  if (protectAgainstEmpty(html)) {
    output.push({
      type: "text/html",
      value: html
    });
  }

  if (output.length > 0) {
    return output;
  } else return null;
}

/**
 * -create attachments for the data body of the sendgrid mail client API call
 * takes in a list file paths to be attached in the email, new line separated
 * @param {*} attachments
 */
function createAttachment(attachments) {
  if (!protectAgainstEmpty(attachments)) {
    return null;
  }
  let output = [];

  let fileArray = attachments.split("\n");
  if (attachments.includes("\r\n")) {
    fileArray = attachments.split("\r\n");
  }

  fileArray.forEach(attachment => {
    try {
      if (protectAgainstEmpty(attachment)) {
        const file = fs.readFileSync(attachment, "binary");
        output.push({
          content: Buffer.from(file, "binary").toString("base64"),
          filename: filePath.basename(attachment),
          disposition: "attachment"
        });
        log.debug(`Attachment file ${attachment} was added.`);
      } else {
        log.debug(`Ignoring empty line fo attachment.`);
      }
    } catch (e) {
      log.err(e);
    }
  });

  if (output.length > 0) {
    return output;
  } else return null;
}

module.exports = {
  async sendgridMail() {
    log.debug("Started Sendgrid Mail");

    //Destructure and get properties ready.
    const taskProps = utils.resolveInputParameters();
    const { to, cc, bcc, from, replyTo, subject, text, html, apiKey, templateId, dynamicTemplateData, attachments } = taskProps;

    client.setApiKey(apiKey);

    let data = {
      from: {
        email: from
      },
      personalizations: []
    };

    if (protectAgainstEmpty(replyTo)) {
      data["reply_to"] = {
        email: replyTo
      };
    }

    if (protectAgainstEmpty(templateId)) {
      data["template_id"] = templateId;
    }

    if (splitStrToObjects(to)) {
      data["personalizations"].push({ to: splitStrToObjects(to) });
    }

    if (protectAgainstEmpty(subject)) {
      data["subject"] = subject;
    }

    if (splitStrToObjects(cc)) {
      data["personalizations"][0]["cc"] = splitStrToObjects(cc);
    }

    if (splitStrToObjects(bcc)) {
      data["personalizations"][0]["bcc"] = splitStrToObjects(bcc);
    }

    if (createContent(text, html)) {
      data["content"] = createContent(text, html);
    }

    if (checkForJson(dynamicTemplateData)) {
      data["personalizations"][0]["dynamic_template_data"] = checkForJson(dynamicTemplateData);
    }

    if (protectAgainstEmpty(attachments)) {
      data["attachments"] = createAttachment(attachments);
    }

    if (process.env.HTTP_PROXY) {
      log.debug(`Setting Proxy`);
      let agent = new HttpsProxyAgent(process.env.HTTP_PROXY);
      client.setDefaultRequest("httpsAgent", agent);
      client.setDefaultRequest("proxy", false);
    }

    log.debug(`JSON body: ${JSON.stringify(data)}`);

    let request = {};
    request.body = JSON.stringify(data);
    request.method = "POST";
    request.url = "/v3/mail/send";

    log.debug(`stringify request made by client: ${JSON.stringify(client.createRequest(request))}`);

    try {
      await client.request(request);
      log.good("Email successfully sent");
    } catch (err) {
      log.err(err);
      process.exit(1);
    }
    log.debug("Finished Sendgrid Mail");
  }
};
