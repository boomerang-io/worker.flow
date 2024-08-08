import { log, params } from "@boomerang-io/task-core";
import fetch from "node-fetch";
import { CloudEvent, HTTP } from "cloudevents";

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

export async function sendMailToMember() {
  log.debug("Starting Send Mail to Member Plugin");

  const { url, to, subject, message } = params;

  //validate mandatory fields
  if (!url) {
    log.err("no endpoint has been specified");
    process.exit(1);
  }

  const event = new CloudEvent({
    subject: "email_user",
    type: "com.ibm.essentials.core.event.mail",
    source: "/messaging/mail/event",
    datacontenttype: "application/json",
    data: {
      inputs: {
        toUserIds: to,
        body: message,
        subject,
      },
    },
  });

  const binaryMessage = HTTP.structured(event);

  const requestConfig = {
    method: "POST",
    body: binaryMessage.body,
    headers: binaryMessage.headers,
  };

  log.debug("requestConfig:");
  log.debug(requestConfig);

  /**
   * this task is calling internal services. Tried using axios but some default proxy configurations were causing
   * the request to try to reach a proxy (instead of running without proxy). So defaulted to node-fetch, which we
   * will continue to use for our internal end points.
   */

  try {
    await fetch(url, requestConfig);
    log.good("Email was succesfully sent!");
  } catch (e) {
    log.err(e);
    process.exit(1);
  }

  log.debug("Finished Send Mail to Member Plugin");
}
export async function createSupportCenterTicket() {
  log.debug("Starting Create Support Center Ticket Plugin");

  //Destructure and get properties ready.
  const {
    url,
    accessToken,
    ownerId,
    teamId,
    catalogServiceId,
    subject,
    description,
    type,
  } = params;

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
    type: type,
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
        "x-access-token": accessToken,
      },
    })
      .then((body) => {
        log.debug(`Response Received: ${JSON.stringify(body)}`);
        log.good("Response successfully received!");
      })
      .catch((err) => {
        log.err(err);
        process.exit(1);
      });
  } catch (e) {
    log.err(e);
    process.exit(1);
  }

  log.debug("Finished Create Support Center Ticket Plugin");
}
export async function sendNotification() {
  log.debug("Starting Platform Notification Plugin");

  const { url, type, target, title, message } = params;

  //validate mandatory fields
  if (!url) {
    log.err("no endpoint has been specified");
    process.exit(1);
  }
  if (type === undefined || type === null) {
    log.err("No type has been specified");
    process.exit(1);
  }

  let bodyString = JSON.stringify({
    target: {
      type: type,
      userId: type === "user" ? target : "",
      groupName: type === "group" ? target : "",
    },
    payload: {
      title: title,
      content: message,
      type: "notification",
    },
  });
  try {
    await fetch(url, {
      method: "POST",
      body: bodyString,
      headers: {
        "Content-Type": "application/json",
        "x-access-token": "96f0b5a2-2e23-4561-a877-005c24df9805",
      },
    })
      .then((res) => res.json())
      .then((json) => log.debug(json))
      .catch((err) => {
        log.err(err);
        process.exit(1);
      });
  } catch (e) {
    log.err(e);
    process.exit(1);
  }

  log.debug("Finished Platform Notification Plugin");
}
