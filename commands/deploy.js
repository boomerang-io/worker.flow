const log = require("../log.js");
const utils = require("../utils.js");
const { CICDError } = require('../error.js')
const shell = require("shelljs");
const fileCommand = require("./file.js");

tion exec(command) {
turn new Promise(function (resolve, reject) {
  g.debug("Command directory:", shell.pwd().toString());
    debug("Command to execute:", command);
  ell.exec(command, config, function (code, stdout, stderr) {
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

    //Destructure and get properties ready.
    const taskProps = utils.resolveCICDTaskInputProps();
    // const { path, script } = taskProps;
    const shellDir = "/cli/cicd";
    config = {
      verbose: true,
    }

    try {
      shell.cd("/data");
      log.ci("Initializing Dependencies");
<<<<<<< HEAD
      await exec(shellDir + '/deploy/initialize-dependencies.sh ' + taskProps['deploy.type'] + ' ' + taskProps['deploy.kube.version']);
      if (taskProps['deploy.type'] === "kubernetes") {
        var kubePort = "8080";
        if (taskProps['system.mode'] === "nodejs") {
          kubePort = "3000";
        }
        fileCommand.replaceTokensInFileWithProps(shellDir + '/deploy', 'kube.yaml', '@', '@', taskProps, undefined);
        await exec(shellDir + '/deploy/kubernetes.sh ' + shellDir + '/deploy/kube.yaml');
      } else if (taskProps['deploy.type'] === "helm") {
        await exec(shellDir + '/deploy/helm.sh ' + taskProps['global/helm.repo.url'] + ' ' + taskProps['global/deploy.helm.chart'] + ' ' + taskProps['global/deploy.helm.release'] + ' ' + taskProps['global/helm.image.tag']);
      }
=======
      await exec(shellDir + '/deploy/initialize-dependencies.sh ' + taskProps['build.tool'] + ' ' + taskProps['build.tool.version']);
>>>>>>> c06bd099aba27ba3a4698468827cf8d4315e09ec
      await exec(shellDir + '/common/footer.sh');
    } catch (e) {
      log.err("  Error encountered. Code: " + e.code + ", Message:", e.message);
      process.exit(1);
    } finally {
      log.debug("End Deploy Plugin");
    }
  }
};
