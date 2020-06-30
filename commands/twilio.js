const { log, utils } = require("@boomerang-worker/core");
const Twilio = require("twilio");
const TwilioRequestClient = require("twilio/lib/base/RequestClient.js");

module.exports = {
  async sendSMS() {
    log.debug("Started sendSMS Twilio Plugin");
    //https://www.twilio.com/docs/sms/tutorials/how-to-send-sms-messages-node-js?code-sample=code-send-an-sms-using-the-programmable-sms-api&code-language=Node.js&code-sdk-version=3.x

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { accountSid, token, from, to, message } = taskProps;

    // log.debug("To", to);
    // log.debug("From", from);

    // if (!String(to).startsWith("+") || !String(from).startsWith("+")) {
    //     // Logic taken from https://www.twilio.com/docs/sms/tutorials/how-to-send-sms-messages-node-js
    //     log.err("Both the from and to parameters must use E.164 formatting ('+' and a country code, e.g., '+1')");
    //     process.exit(1);
    // }

    // Do we want a foreach multiline supported?
    // https://www.twilio.com/docs/sms/tutorials/how-to-send-sms-messages-node-js#send-a-message-to-multiple-recipients
    // toArray = to !== null ? to.split("\n") : [];

    log.debug("HTTP_PROXY:", process.env.HTTP_PROXY);
    const client = Twilio(accountSid, token, {
      httpClient: new TwilioRequestClient(process.env.HTTP_PROXY)
    });

    try {
      client.messages
        .create({
          body: message,
          from: from,
          to: to
        })
        .then(message => log.good(message));
    } catch (error) {
      log.err(error);
      process.exit(1);
    }

    log.debug("Finished sendSMS Twilio Plugin");
  }
};
