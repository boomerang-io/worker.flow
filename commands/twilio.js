import { log, params } from "@boomerang-io/task-core";
import Twilio from "twilio";
// const TwilioRequestClient = require("twilio/lib/base/RequestClient.js");

export async function sendSMS() {
  log.debug("Started sendSMS Twilio Plugin");
  //https://www.twilio.com/docs/sms/tutorials/how-to-send-sms-messages-node-js?code-sample=code-send-an-sms-using-the-programmable-sms-api&code-language=Node.js&code-sdk-version=3.x

  //Destructure and get properties ready.
  const { accountSid, token, from, to, message } = params;

  // Do we want a foreach multiline supported?
  // https://www.twilio.com/docs/sms/tutorials/how-to-send-sms-messages-node-js#send-a-message-to-multiple-recipients
  // toArray = to !== null ? to.split("\n") : [];

  const client = Twilio(accountSid, token);

  try {
    await client.messages
      .create({
        body: message,
        from: from,
        to: to,
      })
      .then((message) => log.good(JSON.stringify(message)));
  } catch (error) {
    log.err(error);
    process.exit(1);
  }

  log.debug("Finished sendSMS Twilio Plugin");
}
