const log = require("../log.js");
const fetch = require("node-fetch");
const utils = require("../utils.js");

module.exports = {
  sendMailToMember() {
    log.debug("Starting Send Mail to Member Plugin");

    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { to, subject, message } = taskProps;

    bodyString = JSON.stringify({
      subject: subject,
      body: message
    });
    try {
      fetch(
        "http://bmrg-core-services-mail.bmrg-live/mail/send/emailUser?memberId=" +
        to,
        {
          method: "POST",
          body: bodyString,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    } catch (e) {
      log.err(e);
    }

    log.debug("Finished Send Mail to Member Plugin");
  }
};
