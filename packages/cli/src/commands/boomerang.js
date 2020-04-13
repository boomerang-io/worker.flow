const { log, utils } = require("@boomerang-worker/core");
const fetch = require("node-fetch");

module.exports = {
  async sendMailToMember() {
    log.debug("Starting Send Mail to Member Plugin");

    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { to, subject, message } = taskProps;

    bodyString = JSON.stringify({
      subject: subject,
      body: message,
    });
    try {
      await fetch("http://bmrg-core-services-messaging.bmrg-live/messaging/mail/send/emailUser?memberId=" + to, {
        method: "POST",
        body: bodyString,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (e) {
      log.err(e);
    }

    log.debug("Finished Send Mail to Member Plugin");
  },
  async createSupporTicket() {
    log.debug("Starting Create Support Ticket Plugin");

    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { project, subject, message } = taskProps;

    bodyString = JSON.stringify({
      subject: subject,
      body: message,
    });
    try {
      await fetch("http://bmrg-core-services-support/internal/support/ticket?projectId=" + project, {
        method: "POST",
        body: bodyString,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (e) {
      log.err(e);
    }

    log.debug("Finished Send Mail to Member Plugin");
  },
};
