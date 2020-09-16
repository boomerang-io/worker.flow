const { log, utils } = require("@boomerang-io/worker-core");
const sgMail = require("@sendgrid/mail");

function strSplit(str) {
  let retValue = str;
  if (str && typeof str === "string" && str.includes(",")) {
    retValue = str.split(",");
  }
  return retValue;
}

module.exports = {
  /**
   * required inputs
   * -to
   * -from
   * -apiKey
   */

  async sendgridMail() {
    log.debug("Started Simple Mail");

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
      to: toInput,
      cc: ccInput,
      bcc: bccInput,
      replyTo: replyToInput,
      from: fromInput,
      subject,
      text,
      html,
      templateId,
      dynamic_template_data: dynamicTemplateData
    };

    log.debug(msg);

    try {
      await sgMail.send(msg);
      log.good("Email successfully sent");
    } catch (err) {
      log.err(err);
    }
  }
};
