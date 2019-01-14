const fetch = require("node-fetch");
const log = require("../log.js");
const utils = require("../utils.js");

module.exports = {
  //TODO implement a fetch that 
  execute() {
    log.debug("Started HTTP Call Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    log.debug(taskProps);
    const { url: url, method: method } = taskProps;

    //TODO finish out passing in of parameters
    fetch(
      url,
      {
        method: method,
        headers: {
          "X-JFrog-Art-Api":
            "AKCp5Z2NfDUZgvYrspbPwhR1byifksXAgJSFTssz5tG7wj41RyfgM1pJxPPn5FRZqTwrhtNZx"
        }
      }
    ).then(res => {
      return new Promise((resolve, reject) => {
        const dest = fs.createWriteStream("file");
        res.body.pipe(dest);
        fs.rename("file", "/data/file", function (err) {
          if (err) throw err;
          console.log("Successfully renamed - AKA moved!");
        });
        res.body.on("error", err => {
          reject(err);
        });
        dest.on("finish", () => {
          resolve();
        });
        dest.on("error", err => {
          reject(err);
        });
      });
    });

    log.debug("Finished HTTP Call File Plugin");
  },

};
