const log = require("../log.js");
const fetch = require("node-fetch");
const utils = require("../utils.js");

module.exports = {
  sendNotification() {
    log.debug("Starting Platform NotificationPlugin");

    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { type, target, title, message } = taskProps;

    if (type === undefined || type === null) {
      log.err("No type has been specified");
      process.exit(1);
    }

    bodyString = JSON.stringify({
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
      fetch("http://bmrg-core-services-notifications.bmrg-live/notifications/submit", {
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
