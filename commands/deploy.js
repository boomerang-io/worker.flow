const log = require("../log.js");
const utils = require("../utils.js");
const { CICDError } = require('../error.js')
const shell = require("shelljs");
const fileCommand = require("./file.js");

function exec(command) {
  return new Promise(function (resolve, reject) {
    log.debug("Command directory:", shell.pwd().toString());
    log.debug("Command to execute:", command);
    shell.exec(command, config, function (code, stdout, stderr) {
      if (code) {
        reject(new CICDError(code, stderr));
      }
      resolve(stdout ? stdout : stderr);
    });
  });
}

module.exports = {
  async execute() {
    log.debug("Inside Deploy Plugin");

    const taskProps = utils.resolveCICDTaskInputProps();
    const shellDir = "/cli/cicd";
    config = {
      verbose: true,
    }

    try {
      shell.cd("/data");
      log.ci("Initializing Dependencies");
      await exec(shellDir + '/deploy/initialize-dependencies.sh ' + taskProps['deploy.type'] + ' ' + taskProps['deploy.kube.version']);
      if (taskProps['deploy.type'] === "kubernetes") {
        var kubePort = "8080";
        if (taskProps['system.mode'] === "nodejs") {
          kubePort = "3000";
        }
        // TODO: orgProp = `echo $TEAM_NAME | sed 's/[^a-zA-Z0-0]//g' | tr '[:upper:]' '[:lower:]'`
        fileCommand.replaceTokensInFileWithProps(shellDir + '/deploy', 'kube.yaml', '@', '@', taskProps, 'g');
        await exec(shellDir + '/deploy/kubernetes.sh ' + shellDir + '/deploy/kube.yaml');
      } else if (taskProps['deploy.type'] === "helm") {
        await exec(shellDir + '/deploy/helm.sh ' + taskProps['global/helm.repo.url'] + ' ' + taskProps['global/deploy.helm.chart'] + ' ' + taskProps['global/deploy.helm.release'] + ' ' + taskProps['global/helm.image.tag'] + ' ' + taskProps['version.name']);
      }
      await exec(shellDir + '/common/footer.sh');
    } catch (e) {
      log.err("  Error encountered. Code: " + e.code + ", Message:", e.message);
      process.exit(1);
    } finally {
      log.debug("End Deploy Plugin");
    }
  }
};
