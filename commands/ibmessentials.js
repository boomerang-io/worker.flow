const { log, utils } = require("@boomerang-io/worker-core");
const fetch = require("node-fetch");
const { CloudEvent, HTTP } = require("cloudevents");

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

module.exports = {
  async sendMailToMember() {
    log.debug("Starting Send Mail to Member Plugin");

    const taskProps = utils.resolveInputParameters();
    const { to, subject, message } = taskProps;

    const event = new CloudEvent({
      subject: "email_user",
      type: "com.ibm.essentials.core.event.mail",
      source: "/messaging/mail/event",
      datacontenttype: "application/json",
      data: {
        inputs: {
          toUserIds: to,
          body: message,
          subject
        }
      }
    });

    const binaryMessage = HTTP.structured(event);

    const requestConfig = {
      method: "POST",
      body: binaryMessage.body,
      headers: binaryMessage.headers
    };

    log.debug("requestConfig:");
    log.debug(requestConfig);

    /**
     * this task is calling internal services. Tried using axios but some default proxy configurations were causing
     * the request to try to reach a proxy (instead of running without proxy). So defaulted to node-fetch, which we
     * will continue to use for our internal end points.
     */

    try {
      await fetch("http://bmrg-core-services-messaging/messaging/mail/event", requestConfig);
      log.good("Email was succesfully sent!");
    } catch (e) {
      log.err(e);
      process.exit(1);
    }

    log.debug("Finished Send Mail to Member Plugin");
  },
  async createSupportCenterTicket() {
    log.debug("Starting Create Support Center Ticket Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.resolveInputParameters();
    const { url, accessToken, ownerId, teamId, catalogServiceId, subject, description, type } = taskProps;

    //validate mandatory fields
    if (!url) {
      log.err("no endpoint has been specified");
      process.exit(1);
    }
    if (!accessToken) {
      log.err("no accessToken has been specified");
      process.exit(1);
    }
    if (!ownerId) {
      log.err("no ticket owner has been specified");
      process.exit(1);
    }
    if (!subject) {
      log.err("no subject has been specified");
      process.exit(1);
    }
    if (!description) {
      log.err("no description has been specified");
      process.exit(1);
    }
    if (!type) {
      log.err("no ticket type has been specified");
      process.exit(1);
    }

    let data = {
      ownerId: ownerId,
      subject: subject,
      description: description,
      type: type
    };

    if (protectAgainstEmpty(teamId)) {
      data["teamId"] = teamId;
    }
    if (protectAgainstEmpty(catalogServiceId)) {
      data["catalogServiceId"] = catalogServiceId;
    }

    log.sys(`JSON body: ${JSON.stringify(data)}`);

    try {
      await fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          "x-access-token": accessToken
        }
      })
        .then(body => {
          log.debug(`Response Received: ${JSON.stringify(body)}`);
          log.good("Response successfully received!");
        })
        .catch(err => {
          log.err(err);
          process.exit(1);
        });
    } catch (e) {
      log.err(e);
      process.exit(1);
    }

    log.debug("Finished Create Support Center Ticket Plugin");
  },
  async sendNotification() {
    log.debug("Starting Platform NotificationPlugin");

    const taskProps = utils.resolveInputParameters();
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
