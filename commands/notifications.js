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
      return process.exit(1);
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
      fetch("http://bmrg-core-services-notifications.bmrg-live/notifications/core/submit" + to, {
        method: "POST",
        body: bodyString,
        headers: {
          "Content-Type": "application/json"
        }
      });
    } catch (e) {
      log.err(e);
    }

    log.debug("Finished Platform Notification Plugin");
  }
};
