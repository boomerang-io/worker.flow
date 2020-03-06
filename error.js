// http://tldp.org/LDP/abs/html/exitcodes.html
// For shell we need to keep the codes 50-99 to be safe
class CICDError extends Error {
  constructor(code, stack) {
    var definedMessage = "An unknown error occurred. Please speak to your support representative.";
    switch (code) {
      case 88:
        definedMessage = "Error occurred in deploying to chosen target. Please review the error messsage or speak to your support representative.";
        break;
      case 89:
        definedMessage = "An error occurred during the build. Please review the error messsage or speak to your support representative.";
        break;
      case 90:
        definedMessage = "An error occurred during the package and building of the Dockerfile. Please review the error messsage or speak to your support representative.";
        break;
      case 91:
        definedMessage = "Helm chart upgrade failed. Please review the error message.";
        break;
      case 92:
        definedMessage = "Helm chart release is required to auto detect the helm chart. To override specify the helm chart(s) in your CI stage, component, or version properties as a comma delimited list.";
        break;
      case 93:
        definedMessage = "Kubernetes namespace is required to auto detect helm release. To override specify helm release in your CI stage.";
        break;
      case 94:
        definedMessage = "Unable to detect helm chart release or version.";
        break;
      case 95:
        definedMessage = "Unable to find test command.";
        break;
      case 96:
        definedMessage = "Unable to find Dockerfile.";
        break;
      case 97:
        definedMessage = "Unable to find build command.";
        break;
      case 98:
        definedMessage = "Unknown property encountered.";
        break;
      case 99:
        definedMessage = "No build tool and/or language specified but required.";
        break;
      case 127:
        definedMessage = "A file required was not found.";
        break;
      case 128:
        definedMessage = "ASoC .irx file failed to generate.";
        break;
      case 129:
        definedMessage = "ASoC scan failed to start.";
        break;
      case 130:
        definedMessage = "ASoC scan failed to complete.";
        break;
      default:
        break;
    }
    var fullMessage = definedMessage + "\n" + stack;
    super(fullMessage);
    this.message = fullMessage;
    this.name = "CICDError";
    this.code = code;
  }
}

module.exports = {
  CICDError
};
