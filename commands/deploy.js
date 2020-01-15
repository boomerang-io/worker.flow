const log = require("../log.js");
const utils = require("../utils.js");
const { CICDError } = require("../error.js");
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
    log.debug("Started CICD Deploy Activity");

    const taskProps = utils.resolveCICDTaskInputProps();
    const shellDir = "/cli/cicd";
    config = {
      verbose: true
    };

    try {
      shell.cd("/data");
      log.ci("Initializing Dependencies");
      await exec(shellDir + "/deploy/initialize-dependencies.sh " + taskProps["deploy.type"] + " " + taskProps["deploy.kube.version"] + " " + taskProps["deploy.kube.namespace"] + " " + taskProps["deploy.kube.host"] + " " + taskProps["deploy.kube.ip"] + " " + taskProps["deploy.kube.token"]);
      log.ci("Deploy Artifacts");
      if (taskProps["deploy.type"] === "kubernetes") {
        var kubePort = "8080";
        if (taskProps["system.mode"] === "nodejs") {
          kubePort = "3000";
        }
        taskProps["process/port"] = kubePort;

        taskProps["process/org"] = taskProps["team.name"]
          .toString()
          .replace(/[^a-zA-Z0-0]/g, "")
          .toLowerCase();
        taskProps["process/component.name"] = taskProps["system.component.name"]
          .toString()
          .replace(/[^a-zA-Z0-0]/g, "")
          .toLowerCase();
        fileCommand.replaceTokensInFileWithProps(shellDir + "/deploy", "kube.yaml", "@", "@", taskProps, "g", "g", true);
        await exec("less " + shellDir + "/deploy/kube.yaml");
        await exec(shellDir + "/deploy/kubernetes.sh " + shellDir + "/deploy/kube.yaml" + " " + taskProps["deploy.kube.namespace"] + " " + taskProps["deploy.kube.host"] + " " + taskProps["deploy.kube.ip"] + " " + taskProps["deploy.kube.token"]);
      } else if (taskProps["deploy.type"] === "helm" && taskProps["system.mode"] === "helm.chart") {
        await exec(
          shellDir +
          "/deploy/helm-chart.sh " +
          JSON.stringify(taskProps["global/helm.repo.url"]) +
          " " +
          taskProps["deploy.helm.chart"] +
          " " +
          taskProps["deploy.helm.release"] +
          " " +
          taskProps["version.name"].substr(0, taskProps["version.name"].lastIndexOf("-")) +
          " " +
          taskProps["deploy.kube.version"] +
          " " +
          taskProps["deploy.kube.namespace"] +
          " " +
          taskProps["deploy.kube.host"] +
          " " +
          taskProps["git.ref"]
        );
      } else if (taskProps["deploy.type"] === "helm") {
        await exec(
          shellDir +
          '/deploy/helm.sh "' +
          taskProps["global/helm.repo.url"] +
          '" "' +
          taskProps["deploy.helm.chart"] +
          '" "' +
          taskProps["deploy.helm.release"] +
          '" "' +
          taskProps["helm.image.tag"] +
          '" "' +
          taskProps["version.name"] +
          '" "' +
          taskProps["deploy.kube.version"] +
          '" "' +
          taskProps["deploy.kube.namespace"] +
          '" "' +
          taskProps["deploy.kube.host"] +
          '"'
        );
      }
    } catch (e) {
      log.err("  Error encountered. Code: " + e.code + ", Message:", e.message);
      process.exit(1);
    } finally {
      await exec(shellDir + "/common/footer.sh");
      log.debug("Finished CICD Deploy Activity");
    }
  }
};
