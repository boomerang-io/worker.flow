const { log, utils } = require("@boomerang-io/worker-core");
const sgMail = require("@sendgrid/mail");

/**
 *
 * @param {*} str - string that could be seperated by comma. If so, we want to turn that it into an array of strings
 *
 */
function strSplit(str) {
  if (str && typeof str === "string" && str.includes(",")) {
    return str.split(",");
  }
  return str;
}

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

module.exports = {
  /**
   * required inputs
   * -to
   * -from
   * -apiKey
   */

  async sendgridMail() {
    log.debug("Started Sendgrid Mail");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { to, cc, bcc, from, replyTo, subject, text, html, apiKey, templateId, dynamicTemplateData } = taskProps;

    const toInput = strSplit(to);
    const ccInput = strSplit(cc);
    const bccInput = strSplit(bcc);
    const fromInput = strSplit(from);
    const replyToInput = strSplit(replyTo);

    sgMail.setApiKey(apiKey);

    const msg = {
      to: protectAgainstEmpty(toInput),
      cc: protectAgainstEmpty(ccInput),
      bcc: protectAgainstEmpty(bccInput),
      replyTo: protectAgainstEmpty(replyToInput),
      from: protectAgainstEmpty(fromInput),
      subject: protectAgainstEmpty(subject),
      text: protectAgainstEmpty(text),
      html: protectAgainstEmpty(html),
      templateId: protectAgainstEmpty(templateId),
      dynamic_template_data: checkForJson(dynamicTemplateData)
    };

    log.debug(msg);

    try {
      await sgMail.send(msg);
      log.good("Email successfully sent");
    } catch (err) {
      log.err(err);
      process.exit(1);
    }
    log.debug("Finished Sendgrid Mail");
  }
};
