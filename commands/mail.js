const { log, utils } = require("@boomerang-io/worker-core");
const HttpsProxyAgent = require("https-proxy-agent");
const filePath = require("path");
const fs = require("fs");
const client = require("@sendgrid/client");
const postmark = require("postmark");
const { UpdateMessageStreamRequest } = require("postmark/dist/client/models");

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
 * contentType, bodyContent
 * @param {"Text", "HTML"} contentType
 * @param {*} bodyContent
 */
function createContent(contentType, bodyContent) {
  if (!protectAgainstEmpty(contentType) && !protectAgainstEmpty(bodyContent)) {
    return null;
  }

  let output = [];
  switch (contentType) {
    case "Text":
      output.push({
        type: "text",
        value: bodyContent
      });
      break;
    case "HTML":
      output.push({
        type: "text/html",
        value: bodyContent
      });
      break;
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
  async sendEmailWithSendgrid() {
    log.debug("Started send Email With Sendgrid");

    //Destructure and get properties ready.
    const taskProps = utils.resolveInputParameters();
    const { to, cc, bcc, from, replyTo, subject, contentType, bodyContent, apiKey, attachments } = taskProps;

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

    if (createContent(contentType, bodyContent)) {
      data["content"] = createContent(contentType, bodyContent);
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

    log.sys(`stringify request made by client: ${JSON.stringify(client.createRequest(request))}`);

    try {
      await client.request(request);
      log.good("Email with Sendgrid successfully sent");
    } catch (err) {
      log.err(err);
      process.exit(1);
    }
    log.debug("Finished Send Email With Sendgrid");
  },
  async sendEmailWithSendgridTemplate() {
    log.debug("Started Send Email With Sendgrid Template");

    //Destructure and get properties ready.
    const taskProps = utils.resolveInputParameters();
    const { to, cc, bcc, from, replyTo, subject, apiKey, templateId, dynamicTemplateData, attachments } = taskProps;

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

    log.sys(`stringify request made by client: ${JSON.stringify(client.createRequest(request))}`);

    try {
      await client.request(request);
      log.good("Email with Sendgrid Template successfully sent");
    } catch (err) {
      log.err(err);
      process.exit(1);
    }
    log.debug("Finished Send Email With Sendgrid Template");
  },
  async sendPostmarkEmailWithTemplate() {
    log.debug("Started Send Email with Template");

    //Destructure and get properties ready.
    const taskProps = utils.resolveInputParameters();
    // const { to, cc, bcc, from, replyTo, subject, contentType, bodyContent, apiKey, attachments } = taskProps;
    const { token, from, to, templateId, templateAlias, templateModel, tag, messageStream } = taskProps;

    // Validate input
    if (!token || !from || !to) {
      log.err("A required parameter has not been provided. Please check your parameters and try again.", "\nToken: " + token, "\nFrom: " + from, "\nTo: " + to);
      process.exit(1);
    }

    var templateModelPayload = {};
    if (templateModel) {
      templateModelPayload = checkForJson(templateModel);
    }

    if (!templateId && !templateAlias) {
      log.err("Either Template ID or Template Alias needs to be provided. Please check your parameters and try again.", "\nTemplate ID: " + templateId, "\nTemplate Alias: " + templateAlias);
      process.exit(1);
    }

    if (!messageStream) {
      log.warn("Message Stream not provided. Defaulting to 'outbound'.");
      messageStream = "outbound";
    }

    var client = new postmark.ServerClient(token);

    let data = {
      From: from,
      To: to,
      TemplateModel: templateModelPayload,
      MessageStream: messageStream
    };

    if (templateId) {
      data.templateId = templateId;
    } else {
      data.templateAlias = templateAlias;
    }

    if (tag) {
      data.tag = tag;
    }

    // It catches itself and prints a more descriptive error message
    await client.sendEmailWithTemplate(JSON.stringify(data)).then(res => {
      utils.setOutputParameters(res);
      log.good("The task completed successfully with response saved as result parameter.", "\nTo: " + res.To, "\nSubmitted At: " + res.SubmittedAt, "\nMessage: " + res.Message, "\nID: " + res.MessageID);
    });
  }
};
