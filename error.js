class CICDError extends Error {
  constructor(code, stack) {
    var definedMessage = "An unknown error occurred. Please speak to your support representative.";
    switch (code) {
      case 1:
        definedMessage = "Unknown property encountered."
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