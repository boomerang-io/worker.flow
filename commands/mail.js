import { log, params, results } from "@boomerang-io/task-core";
import HttpsProxyAgent from "https-proxy-agent";
import filePath from "path";
import fs from "fs";
import client from "@sendgrid/client";
import postmark from "postmark";

/**
 * checkIfEmpty - Check if param is set or not, in case of mandatory inputs
 * unsetField - Removes every property from object, with the name 'fieldName'
 * checkParameters - Validates all attributes of the supplied object. Returns true if all parameters are valid.
 * checkForJson - Validates the payload is JSON
 */
import {
  checkIfEmpty,
  unsetField,
  checkParameters,
  checkForJson,
} from "./../libs/utilities.js";

function splitStrToObjects(str) {
  if (checkIfEmpty(str)) {
    return;
  }
  if (str.includes(",")) {
    return str.split(",").map((strEmail) => {
      return { email: strEmail };
    });
  }
  // TODO: functionality could be used in the future.
  // if (str.includes(";")) {
  //   return str.split(";").map(strEmail => {
  //     return { email: strEmail };
  //   });
  // }
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
  if (checkIfEmpty(contentType) || checkIfEmpty(bodyContent)) {
    return null;
  }

  let output = [];
  switch (contentType) {
    case "Text":
      output.push({
        type: "text",
        value: bodyContent,
      });
      break;
    case "HTML":
      output.push({
        type: "text/html",
        value: bodyContent,
      });
      break;
  }
  if (output.length) {
    return output;
  } else return null;
}

/**
 * -create attachments for the data body of the sendgrid mail client API call
 * takes in a list file paths to be attached in the email, new line separated
 * @param {*} attachments
 */
function createAttachment(attachments) {
  if (checkIfEmpty(attachments)) {
    return null;
  }
  let output = [];

  let fileArray = attachments.split("\n");
  if (attachments.includes("\r\n")) {
    fileArray = attachments.split("\r\n");
  }

  fileArray.forEach((attachment) => {
    try {
      if (!checkIfEmpty(attachment)) {
        const file = fs.readFileSync(attachment, "binary");
        output.push({
          content: Buffer.from(file, "binary").toString("base64"),
          filename: filePath.basename(attachment),
          disposition: "attachment",
        });
        log.debug(`Attachment file ${attachment} was added.`);
      } else {
        log.debug(`Ignoring empty line fo attachment.`);
      }
    } catch (e) {
      log.err(e);
    }
  });

  if (output.length) {
    return output;
  } else return null;
}

/**
 * @param {string} to  - mandatory
 * @param {string} [cc]
 * @param {string} [bcc]
 * @param {string} from  - mandatory
 * @param {string} [replyTo]
 * @param {string} [subject]
 * @param {string} contentType  - mandatory
 * @param {string} [bodyContent]
 * @param {string} apiKey  - mandatory
 * @param {string} [attachments]
 */
export async function sendEmailWithSendgrid() {
  // https://github.com/sendgrid/sendgrid-nodejs/blob/main/packages/client/USAGE.md#v3-mail-send
  log.debug("Started send Email With Sendgrid");

  // Destructure and get properties ready.
  const {
    to,
    cc,
    bcc,
    from,
    replyTo,
    subject,
    contentType,
    bodyContent,
    apiKey,
    attachments,
  } = params;

  // Validate mandatory parameters
  if (checkParameters({ to, from, contentType, apiKey })) {
    log.err(`Invalid mandatory parameters. Check log for details`);
    process.exit(1);
  }

  if (
    checkParameters({ cc, bcc, replyTo, subject, bodyContent, attachments })
  ) {
    log.warn(`These input fields are not set.`);
  }

  client.setApiKey(apiKey);

  let data = {
    from: {
      email: from,
    },
    personalizations: [],
  };

  if (!checkIfEmpty(replyTo)) {
    data["reply_to"] = {
      email: replyTo,
    };
  }

  if (splitStrToObjects(to)) {
    data["personalizations"].push({ to: splitStrToObjects(to) });
  }

  if (!checkIfEmpty(subject)) {
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

  if (!checkIfEmpty(attachments)) {
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
      .catch((err) => {
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
      log.err(
        `Email with Sendgrid was NOT sent. StatusCode: ${clientResponse.code}`
      );
      log.debug(
        `message: ${clientResponse.message} \n ${clientResponse.toString()}`
      );
      process.exit(1);
    }
  } catch (err) {
    log.err("Email with Sendgrid was NOT sent");
    log.err(err);
    process.exit(1);
  }
  log.debug("Finished Send Email With Sendgrid");
}

/**
 * @param {string} to  - mandatory
 * @param {string} [cc]
 * @param {string} [bcc]
 * @param {string} from  - mandatory
 * @param {string} [replyTo]
 * @param {string} [subject]
 * @param {string} apiKey  - mandatory
 * @param {string} templateId  - mandatory
 * @param {string} [dynamicTemplateData]
 * @param {string} [attachments]
 */
export async function sendEmailWithSendgridTemplate() {
  // Documentation on send mail API: https://docs.sendgrid.com/api-reference/mail-send/mail-send
  log.debug("Started Send Email With Sendgrid Template");

  // Destructure and get properties ready.
  const {
    to,
    cc,
    bcc,
    from,
    replyTo,
    subject,
    apiKey,
    templateId,
    dynamicTemplateData,
    attachments,
  } = params;

  // Validate mandatory parameters
  if (checkParameters({ to, from, templateId, apiKey })) {
    log.err(`Invalid mandatory parameters. Check log for details`);
    process.exit(1);
  }

  client.setApiKey(apiKey);

  let data = {
    from: {
      email: from,
    },
    personalizations: [],
  };

  if (!checkIfEmpty(replyTo)) {
    data["reply_to"] = {
      email: replyTo,
    };
  }

  if (!checkIfEmpty(templateId)) {
    data["template_id"] = templateId;
  }

  if (splitStrToObjects(to)) {
    data["personalizations"].push({ to: splitStrToObjects(to) });
  }

  if (!checkIfEmpty(subject)) {
    data["subject"] = subject;
  }

  if (splitStrToObjects(cc)) {
    data["personalizations"][0]["cc"] = splitStrToObjects(cc);
  }

  if (splitStrToObjects(bcc)) {
    data["personalizations"][0]["bcc"] = splitStrToObjects(bcc);
  }

  let newdynamicTemplateData = checkForJson(dynamicTemplateData);
  if (newdynamicTemplateData) {
    data["personalizations"][0]["dynamic_template_data"] =
      newdynamicTemplateData;
  }

  if (!checkIfEmpty(attachments)) {
    data["attachments"] = createAttachment(attachments);
  }

  if (process.env.HTTP_PROXY) {
    log.debug(`Setting Proxy: ${process.env.HTTP_PROXY}`);
    let agent = new HttpsProxyAgent(process.env.HTTP_PROXY);
    client.setDefaultRequest("httpsAgent", agent);
    client.setDefaultRequest("proxy", false);
  }

  log.debug(`JSON body: ${JSON.stringify(data)}`);

  let request = {};
  request.body = JSON.stringify(data);
  request.method = "POST";
  request.url = "/v3/mail/send";

  // create a shallow copy of the request for logging
  const clientRequest = { ...client.createRequest(request) }; // Shallow copy
  unsetField(clientRequest, "Authorization"); // remove sensitive fileds ("Authorization")
  log.debug(
    `stringify request made by client: ${JSON.stringify(clientRequest)}`
  );
  try {
    const clientResponse = await client
      .request(request)
      .then(([response, body]) => {
        log.debug(`response.statusCode: ${response.statusCode}`); // for success body is empty
        return response;
      })
      .catch((err) => {
        log.debug(`code:${err.code}`);
        log.debug(`message:${err.message}`);
        log.debug(`response.headers:${JSON.stringify(err.response.headers)}`);
        log.debug(`response.body:${JSON.stringify(err.response.body)}`);
        return err;
      });

    // https://docs.sendgrid.com/api-reference/how-to-use-the-sendgrid-v3-api/responses#status-codes
    if (/2\d\d/g.test(clientResponse.statusCode)) {
      log.good("Email with Sendgrid Template successfully sent");
    } else {
      log.err(
        `Email with Sendgrid Template was NOT sent. StatusCode: ${clientResponse.code}`
      );
      log.debug(
        `message: ${clientResponse.message} \n ${clientResponse.toString()}`
      );
      process.exit(1);
    }
  } catch (err) {
    log.err("Email with Sendgrid Template was NOT sent");
    log.err(err);
    process.exit(1);
  }
  log.debug("Finished Send Email With Sendgrid Template");
}
/**
 *
 */
export async function sendPostmarkEmailWithTemplate() {
  log.debug("Started Send Email with Template");

  //Destructure and get properties ready.
  const {
    token,
    from,
    to,
    templateId,
    templateAlias,
    templateModel,
    tag,
    messageStream,
  } = params;

  if (checkParameters({ token, from, to })) {
    log.err(
      `A required parameter has not been provided. Please check your parameters and try again.`
    );
    process.exit(1);
  }

  if (checkIfEmpty(templateId) && checkIfEmpty(templateAlias)) {
    log.err(
      "Either Template ID or Template Alias needs to be provided. Please check your parameters and try again.",
      "\nTemplate ID: " + templateId,
      "\nTemplate Alias: " + templateAlias
    );
    process.exit(1);
  }

  var templateModelPayload = {};
  if (templateModel) {
    templateModelPayload = checkForJson(templateModel);
  }

  if (checkIfEmpty(messageStream)) {
    log.warn("Message Stream not provided. Defaulting to 'outbound'.");
    messageStream = "outbound";
  }

  var client = new postmark.ServerClient(token);

  let data = {
    From: from,
    To: to,
    TemplateModel: templateModelPayload,
    MessageStream: messageStream,
  };

  if (!checkIfEmpty(templateId)) {
    data.templateId = templateId;
  } else {
    data.templateAlias = templateAlias;
  }

  if (tag) {
    data.tag = tag;
  }

  log.debug("Created Payload: ", data);

  try {
    // It catches itself and prints a more descriptive error message
    let clientResponse = await client.sendEmailWithTemplate(
      JSON.stringify(data)
    );
    await results(clientResponse);
    // https://postmarkapp.com/developer/api/overview#error-codes
    if (
      /2\d\d/g.test(clientResponse.ErrorCode) ||
      /0/g.test(clientResponse.ErrorCode)
    ) {
      log.good(
        "The task completed successfully with response saved as result parameter.",
        "\nTo: " + clientResponse.To,
        "\nSubmitted At: " + clientResponse.SubmittedAt,
        "\nMessage: " + clientResponse.Message,
        "\nID: " + clientResponse.MessageID
      );
    } else {
      log.err(
        "The task failed with response saved as result parameter.",
        "\nTo: " + clientResponse.To,
        "\nSubmitted At: " + clientResponse.SubmittedAt,
        "\nMessage: " + clientResponse.Message,
        "\nID: " + clientResponse.MessageID
      );
      process.exit(1);
    }
  } catch (err) {
    log.err("EmailWithTemplate with Postmark was NOT sent");
    log.err(err);
    process.exit(1);
  }
}
