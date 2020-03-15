const log = require("../log.js");
const utils = require("../utils.js");
const { CICDError } = require("../error.js");
const shell = require("shelljs");

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
    log.debug("Started CICD Build Activity");

    //Destructure and get properties ready.
    const taskProps = utils.resolveCICDTaskInputProps();
    // const { path, script } = taskProps;
    const shellDir = "/cli/cicd";
    config = {
      verbose: true
    };

    try {
      await exec(shellDir + "/common/initialize.sh " + taskProps["language.version"]);
      log.ci("Initializing Dependencies");
      if (taskProps["system.mode"] === "lib.jar" || taskProps["system.mode"] === "java") {
        await exec(shellDir + "/common/initialize-dependencies-java.sh " + taskProps["language.version"]);
        await exec(shellDir + "/common/initialize-dependencies-java-tool.sh " + taskProps["build.tool"] + " " + taskProps["build.tool.version"]);
      } else if (taskProps["system.mode"] === "nodejs") {
        await exec(shellDir + "/common/initialize-dependencies-node.sh " + taskProps["build.tool"] + " " + JSON.stringify(taskProps["global/artifactory.url"]) + " " + taskProps["global/artifactory.user"] + " " + taskProps["global/artifactory.password"]);
      } else if (taskProps["system.mode"] === "python" || taskProps["system.mode"] === "lib.wheel") {
        await exec(shellDir + "/common/initialize-dependencies-python.sh " + taskProps["language.version"]);
      } else if (taskProps["system.mode"] === "helm.chart") {
        await exec(shellDir + "/common/initialize-dependencies-helm.sh " + taskProps["kube.version"]);
      }

      log.ci("Retrieving Source Code");
      await exec(shellDir + '/common/git-clone.sh "' + taskProps["git.private.key"] + '" "' + JSON.stringify(taskProps["component/repoSshUrl"]) + '" "' + JSON.stringify(taskProps["component/repoUrl"]) + '" "' + taskProps["git.commit.id"] + '" "' + taskProps["git.lfs"] + '"');

      shell.cd("/data/workspace");
      log.ci("Compile & Package Artifact(s)");
      if (taskProps["system.mode"] === "lib.jar") {
        await exec(
          shellDir +
            "/build/compile-package-jar.sh " +
            taskProps["build.tool"] +
            " " +
            taskProps["build.tool.version"] +
            " " +
            taskProps["version.name"].substr(0, taskProps["version.name"].lastIndexOf("-")) +
            " " +
            JSON.stringify(taskProps["global/maven.repo.url"]) +
            " " +
            taskProps["global/maven.repo.id"] +
            " " +
            taskProps["global/artifactory.user"] +
            " " +
            taskProps["global/artifactory.password"]
        );
      } else if (taskProps["system.mode"] === "java") {
        await exec(
          shellDir +
            "/build/compile-java.sh " +
            taskProps["build.tool"] +
            " " +
            taskProps["build.tool.version"] +
            " " +
            taskProps["version.name"] +
            " " +
            JSON.stringify(taskProps["global/maven.repo.url"]) +
            " " +
            taskProps["global/maven.repo.id"] +
            " " +
            taskProps["global/artifactory.user"] +
            " " +
            taskProps["global/artifactory.password"]
        );
      } else if (taskProps["system.mode"] === "nodejs") {
        await exec(shellDir + "/build/compile-node.sh " + taskProps["build.tool"] + " " + taskProps["node.cypress.install.binary"]);
      } else if (taskProps["system.mode"] === "python") {
        await exec(shellDir + "/build/compile-python.sh " + taskProps["language.version"] + " " + JSON.stringify(taskProps["global/pypi.registry.host"]) + " " + taskProps["global/pypi.repo.id"] + " " + taskProps["global/pypi.repo.user"] + " " + taskProps["global/pypi.repo.password"]);
      } else if (taskProps["system.mode"] === "lib.wheel") {
        await exec(
          shellDir +
            "/build/compile-package-python-wheel.sh " +
            taskProps["language.version"] +
            " " +
            taskProps["version.name"].substr(0, taskProps["version.name"].lastIndexOf("-")) +
            " " +
            JSON.stringify(taskProps["global/pypi.repo.url"]) +
            " " +
            taskProps["global/pypi.repo.id"] +
            " " +
            taskProps["global/pypi.repo.user"] +
            " " +
            taskProps["global/pypi.repo.password"]
        );
      } else if (taskProps["system.mode"] === "helm.chart") {
        await exec(
          shellDir +
            "/build/package-helm.sh " +
            taskProps["version.name"] +
            " " +
            taskProps["global/helm.repo.url"] +
            " " +
            taskProps["helm.chart.directory"] +
            " " +
            taskProps["helm.chart.ignore"] +
            " " +
            taskProps["helm.chart.version.increment"] +
            " " +
            taskProps["helm.chart.version.tag"] +
            " " +
            taskProps["git.ref"]
        );
        await exec(shellDir + "/build/validate-sync-helm.sh " + taskProps["global/helm.repo.url"] + " " + JSON.stringify(taskProps["global/artifactory.url"]) + " " + taskProps["global/artifactory.user"] + " " + taskProps["global/artifactory.password"]);
      }
      if (taskProps["system.mode"] === "docker" || taskProps["docker.enable"]) {
        var dockerFile = taskProps["docker.file"] !== undefined && taskProps["docker.file"] !== null ? taskProps["docker.file"] : "";
        await exec(
          shellDir +
            "/build/package-docker.sh " +
            taskProps["docker.image.name"] +
            " " +
            taskProps["version.name"] +
            " " +
            JSON.stringify(taskProps["team.name"]) +
            " " +
            JSON.stringify(taskProps["global/container.registry.host"]) +
            " " +
            taskProps["global/container.registry.port"] +
            " " +
            taskProps["global/container.registry.user"] +
            " " +
            taskProps["global/container.registry.password"] +
            " " +
            JSON.stringify(taskProps["global/artifactory.url"]) +
            " " +
            taskProps["global/artifactory.user"] +
            " " +
            taskProps["global/artifactory.password"] +
            " " +
            dockerFile
        );
      }
    } catch (e) {
      log.err("  Error encountered. Code: " + e.code + ", Message:", e.message);
      process.exit(1);
    } finally {
      await exec(shellDir + "/common/footer.sh");
      log.debug("Finished CICD Build Activity");
    }
  }
};
