const log = require("../log.js");
const path = require("path");
const utils = require("../utils.js");
const { CICDError } = require("../error.js");
const shell = require("shelljs");
const fileCommand = require("./file.js");

function exec(command) {
  return new Promise(function(resolve, reject) {
    log.debug("Command directory:", shell.pwd().toString());
    log.debug("Command to execute:", command);
    shell.exec(command, config, function(code, stdout, stderr) {
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
      await exec(
        shellDir +
          "/deploy/initialize-dependencies.sh " +
          taskProps["deploy.type"] +
          " " +
          taskProps["deploy.kube.version"] +
          " " +
          taskProps["deploy.kube.namespace"] +
          " " +
          taskProps["deploy.kube.host"] +
          " " +
          taskProps["deploy.kube.ip"] +
          " " +
          taskProps["deploy.kube.token"] +
          " " +
          taskProps["deploy.helm.tls"]
      );

      if (taskProps["deploy.git.clone"]) {
        log.ci("Retrieving Source Code");
        await exec(shellDir + '/common/git-clone.sh "' + taskProps["git.private.key"] + '" "' + JSON.stringify(taskProps["component/repoSshUrl"]) + '" "' + JSON.stringify(taskProps["component/repoUrl"]) + '" "' + taskProps["git.commit.id"] + '" "' + taskProps["git.lfs"] + '"');
      }

      log.ci("Deploy Artifacts");
      if (taskProps["deploy.type"] === "kubernetes") {
        taskProps["process/container.port"] = taskProps["deploy.kubernetes.container.port"] !== undefined ? taskProps["deploy.kubernetes.container.port"] : "8080";
        taskProps["process/service.port"] = taskProps["deploy.kubernetes.service.port"] !== undefined ? taskProps["deploy.kubernetes.service.port"] : "5000";
        taskProps["process/org"] = taskProps["team.name"]
          .toString()
          .replace(/[^a-zA-Z0-9]/g, "")
          .toLowerCase();
        taskProps["process/component.name"] = taskProps["system.component.name"]
          .toString()
          .replace(/[^a-zA-Z0-9]/g, "")
          .toLowerCase();
        var dockerImageName = taskProps["docker.image.name"] !== undefined ? taskProps["docker.image.name"] : taskProps["system.component.name"];
        // Name specification reference: https://docs.docker.com/engine/reference/commandline/tag/
        taskProps["process/docker.image.name"] = dockerImageName
          .toString()
          .replace(/[^a-zA-Z0-9\-\_\.]/g, "")
          .toLowerCase();
        var kubePathAndFile = shellDir + "/deploy/kube.yaml";
        if (taskProps["deploy.kubernetes.file"] !== undefined) {
          var kubePathAndFile = "/data/workspace" + taskProps["deploy.kubernetes.file"];
        }
        var kubePath = path.dirname(kubePathAndFile);
        var kubeFile = path.basename(kubePathAndFile);
        log.sys("Kube Path: ", kubePath);
        log.sys("Kube File: ", kubeFile);
        await fileCommand.replaceTokensInFileWithProps(kubePath, kubeFile, "@", "@", taskProps, "g", "g", true);
        await exec("less " + shellDir + "/deploy/kube.yaml");
        await exec(shellDir + "/deploy/kubernetes.sh " + kubePathAndFile);
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
            '" "' +
            taskProps["deploy.helm.tls"] +
            '"'
        );
      } else if (taskProps["deploy.type"] === "containerRegistry") {
        await exec(
          shellDir +
            '/deploy/containerregistry.sh "' +
            taskProps["docker.image.name"] +
            '" "' +
            taskProps["version.name"] +
            '" "' +
            JSON.stringify(taskProps["team.name"]) +
            '" "' +
            JSON.stringify(taskProps["deploy.container.registry.host"]) +
            '" "' +
            taskProps["deploy.container.registry.port"] +
            '" "' +
            taskProps["deploy.container.registry.user"] +
            '" "' +
            taskProps["deploy.container.registry.password"] +
            '" "' +
            taskProps["deploy.container.registry.path"] +
            '" "' +
            JSON.stringify(taskProps["global/container.registry.host"]) +
            '" "' +
            taskProps["global/container.registry.port"] +
            '" "' +
            taskProps["global/container.registry.user"] +
            '" "' +
            taskProps["global/container.registry.password"] +
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
