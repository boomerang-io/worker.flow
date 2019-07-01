// http://tldp.org/LDP/abs/html/exitcodes.html
// For shell we need to keep the codes 50-99 to be safe
class CICDError extends Error {
  constructor(code, stack) {
    var definedMessage = "An unknown error occurred. Please speak to your support representative.";
    switch (code) {
      case 96:
        definedMessage = "Unable to find Dockerfile."
        break;
      case 97:
        definedMessage = "Unable to find build command."
        break;
      case 98:
        definedMessage = "Unknown property encountered."
        break;
      case 99:
        definedMessage = "No build tool specified but required."
        break;
      case 127:
        definedMessage = "A file required was not found."
        break;
      default:
        break;
    }
    var fullMessage = definedMessage + '\n' + stack;
    super(fullMessage)
    this.message = fullMessage
    this.name = 'CICDError';
    this.code = code;
  }
}

module.exports = {
  CICDError
}