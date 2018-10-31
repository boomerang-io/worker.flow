const log = require("../log.js");
const fetch = require("node-fetch");

module.exports = {
  sendMailToMember(req) {
    log.debug("Starting Send Mail to Member Plugin");

    bodyString = JSON.stringify({
      subject: req.subject,
      body: req.message
    });
    try {
      fetch(
        "http://bmrg-core-services-mail.bmrg-live/mail/send/emailUser?memberId=" +
          req.to,
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
