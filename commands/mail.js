const { log, utils } = require("@boomerang-io/worker-core");
const HttpsProxyAgent = require("https-proxy-agent");
const filePath = require("path");
const fs = require("fs");
const client = require("@sendgrid/client");
const postmark = require("postmark");
const { UpdateMessageStreamRequest } = require("postmark/dist/client/models");

/**
 * Check if param is set or not, in case of mandatory inputs
 * @param {*} input - if the string is empty, we want to pass it as undefined to the api
 *
 */
function checkIfEmpty(input) {
  if (!input || (typeof input === "string" && (input === '""' || input === '" "'))) {
    return false;
  }
  return true;
}

/**
 * Removes every property from object, with the name 'fieldName'
 * @param {object} object
 * @param {string} fieldName
 */
function unsetField(object, fieldName) {
  Object.keys(object).forEach(key => {
    // recursive call
    if (object[key] && object[key] instanceof Object && Object.keys(object[key]).length) {
      unsetField(object[key], fieldName);
    } else {
      if (key === fieldName) {
        delete object[key];
      }
    }
  });
}

/**
 *
 * @param {*} input - if the string is empty, we want to pass it as undefined to the api
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
  /**
   * @param {string} to  / mandatory
   * @param {string} [cc] -
   * @param {string} [bcc]
   * @param {string} from [mandatory]
   * @param {string} [replyTo]
   * @param {string} [subject]
   * @param {string} contentType [mandatory]
   * @param {string} [bodyContent]
   * @param {string} apiKey [mandatory]
   * @param {string} [attachments]
   */
  async sendEmailWithSendgrid() {
    // https://github.com/sendgrid/sendgrid-nodejs/blob/main/packages/client/USAGE.md#v3-mail-send
    log.debug("Started send Email With Sendgrid");

    //Destructure and get properties ready.
    const taskProps = utils.resolveInputParameters();
    const { to, cc, bcc, from, replyTo, subject, contentType, bodyContent, apiKey, attachments } = taskProps;

    if (!checkIfEmpty(to) || !checkIfEmpty(from) || !checkIfEmpty(contentType) || !checkIfEmpty(apiKey)) {
      log.err(`One of these input fields are not set: to, from, contentType, apiKey`);
      process.exit(1);
    }
    if (!checkIfEmpty(cc) || !checkIfEmpty(bcc) || !checkIfEmpty(replyTo) || !checkIfEmpty(subject) || !checkIfEmpty(bodyContent) || !checkIfEmpty(attachments)) {
      log.warn(`One of these input fields are not set: cc, bcc, replyTo, subject, bodyContent, attachments`);
    }

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

    const clientRequest = { ...client.createRequest(request) }; // Shallow copy
    // remove every "Authorization"
    unsetField(clientRequest, "Authorization");
    log.sys(`stringify request made by client: ${JSON.stringify(clientRequest)}`);

    try {
      const clientResponse = await client
        .request(request)
        .then(([response, body]) => {
          // log.debug(`response.statusCode: ${response.statusCode} \n response.body: ${response.body} \n ${body}`);
          log.debug(`response.statusCode: ${response.statusCode}`); // for success body is empty
          return response;
        })
        .catch(err => {
          log.debug(`code:${err.code}`);
          log.debug(`message:${err.message}`);
          log.debug(`response.headers:${JSON.stringify(err.response.headers)}`);
          log.debug(`response.body:${JSON.stringify(err.response.body)}`);
          return err;
          // throw err; // We do not want to go to the catch (:262) we want to process this one (:258)
        });
      // https://docs.sendgrid.com/api-reference/how-to-use-the-sendgrid-v3-api/responses#status-codes
      if (/2\d\d/g.test(clientResponse.statusCode)) {
        log.good("Email with Sendgrid successfully sent");
      } else {
        log.err("Email with Sendgrid was NOT sent");
        log.debug(`statusCode: ${clientResponse.code} \n message: ${clientResponse.message} \n ${clientResponse.toString()}`);
        process.exit(1);
      }
    } catch (err) {
      log.err("Email with Sendgrid was NOT sent");
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

    if (templateId && templateId !== '""') {
      data.templateId = templateId;
    } else {
      data.templateAlias = templateAlias;
    }

    if (tag) {
      data.tag = tag;
    }

    log.debug("Created Payload: ", data);

    // It catches itself and prints a more descriptive error message
    await client.sendEmailWithTemplate(JSON.stringify(data)).then(res => {
      utils.setOutputParameters(res);
      log.good("The task completed successfully with response saved as result parameter.", "\nTo: " + res.To, "\nSubmitted At: " + res.SubmittedAt, "\nMessage: " + res.Message, "\nID: " + res.MessageID);
    });
  }
};
