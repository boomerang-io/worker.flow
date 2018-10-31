const log = require("../log.js");
const fetch = require("node-fetch");
var fs = require('fs');

module.exports = {
  downloadFile(req, inputProps) {

    fetch('https://tools.boomerangplatform.net/artifactory/boomerang/test/hello', {
      method: 'GET',
      headers: {
        'X-JFrog-Art-Api': 'AKCp5Z2NfDUZgvYrspbPwhR1byifksXAgJSFTssz5tG7wj41RyfgM1pJxPPn5FRZqTwrhtNZx'
      }
    })
      .then(res => {
        return new Promise((resolve, reject) => {
          const dest = fs.createWriteStream('file');
          res.body.pipe(dest);
          fs.rename('file', '/data/file', function (err) {
            if (err) throw err
            console.log('Successfully renamed - AKA moved!')
          })
          res.body.on('error', err => {
            reject(err);
          });
          dest.on('finish', () => {
            resolve();
          });
          dest.on('error', err => {
            reject(err);
          });
        });
      });
  },
  uploadFile(req, inputProps) {
    log.debug("Inside Artifactory Upload File Plugin");
  }
};
