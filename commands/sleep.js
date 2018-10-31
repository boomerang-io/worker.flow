const log = require("./../log.js");
const systemSleep = require("system-sleep");

module.exports = {
  sleep(req) {
    log.debug("Inside Sleep Plugin");

    systemSleep(req.duration);

    log.debug("Finished Sleep Plugin");
  }
};
