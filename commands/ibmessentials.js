const { log, utils } = require("@boomerang-io/worker-core");
const fetch = require("node-fetch");
const { CloudEvent, HTTP } = require("cloudevents");

module.exports = {
  async sendMailToMember() {
    log.debug("Starting Send Mail to Member Plugin");

    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { to, subject, message } = taskProps;

    const event = new CloudEvent({
      subject: "email_user",
      type: "com.ibm.essentials.core.event.mail",
      source: "/messaging/mail/event",
      datacontenttype: "application/json",
      data: {
        inputs: {
          userId: to,
          body: message,
          subject
        }
      }
    });

    const binaryMessage = HTTP.structured(event);

    const axiosConfig = {
      method: "POST",
      body: binaryMessage.body,
      headers: binaryMessage.headers
    };

    log.debug("axiosConfig:");
    log.debug(axiosConfig);

    try {
      await fetch("http://bmrg-core-services-messaging/messaging/mail/event", axiosConfig);
      log.good("Email was succesfully sent!");
    } catch (e) {
      log.err(e);
      process.exit(1);
    }

    log.debug("Finished Send Mail to Member Plugin");
  },
  async createSupporTicket() {
    log.debug("Starting Create Support Ticket Plugin");

    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { project, subject, message } = taskProps;

    let bodyString = JSON.stringify({
      subject: subject,
      body: message
    });
    try {
      await fetch("http://bmrg-core-services-support/internal/support/ticket?projectId=" + project, {
        method: "POST",
        body: bodyString,
        headers: {
          "Content-Type": "application/json"
        }
      });
    } catch (e) {
      log.err(e);
    }

    log.debug("Finished Send Mail to Member Plugin");
  },
  async sendNotification() {
    log.debug("Starting Platform NotificationPlugin");

    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { type, target, title, message } = taskProps;

    if (type === undefined || type === null) {
      log.err("No type has been specified");
      process.exit(1);
    }

    let bodyString = JSON.stringify({
      target: {
        type: type,
        userId: type === "user" ? target : "",
        groupName: type === "group" ? target : ""
      },
      payload: {
        title: title,
        content: message,
        type: "notification"
      }
    });
    try {
      await fetch("http://bmrg-core-services-notifications.bmrg-live/notifications/submit", {
        method: "POST",
        body: bodyString,
        headers: {
          "Content-Type": "application/json",
          "x-access-token": "96f0b5a2-2e23-4561-a877-005c24df9805"
        }
      })
        .then(res => res.json())
        .then(json => log.debug(json))
        .catch(err => {
          log.err(err);
          process.exit(1);
        });
    } catch (e) {
      log.err(e);
      process.exit(1);
    }

    log.debug("Finished Platform Notification Plugin");
  }
};
