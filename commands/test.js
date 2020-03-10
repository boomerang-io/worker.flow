const log = require("../log.js");
const utils = require("../utils.js");
const { CICDError } = require("../error.js");
const shell = require("shelljs");
const fs = require("fs");
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
    log.debug("Started CICD Test Activity");

    const taskProps = utils.resolveCICDTaskInputProps();
    const shellDir = "/cli/cicd";
    config = {
      verbose: true
    };

    var testTypes = taskProps["test.type"] !== undefined && taskProps["test.type"] !== null ? taskProps["test.type"].split(",") : [];

    try {
      if (!testTypes.length) {
        log.good("No test types specified.");
      } else {
        shell.cd("/data");
        log.ci("Initializing Dependencies");
        if (taskProps["system.mode"] === "lib.jar" || taskProps["system.mode"] === "java") {
          await exec(shellDir + "/common/initialize-dependencies-java.sh " + taskProps["language.version"]);
          log.ci("Initializing Language Dependencies");
          await exec(shellDir + "/common/initialize-dependencies-java-tool.sh " + taskProps["build.tool"] + " " + taskProps["build.tool.version"]);
        } else if (taskProps["system.mode"] === "nodejs") {
          await exec(shellDir + "/common/initialize-dependencies-node.sh " + taskProps["build.tool"] + " " + JSON.stringify(taskProps["global/artifactory.url"]) + " " + taskProps["global/artifactory.user"] + " " + taskProps["global/artifactory.password"]);
        } else if (taskProps["system.mode"] === "python") {
          await exec(shellDir + "/common/initialize-dependencies-python.sh " + taskProps["language.version"]);
        } else if (taskProps["system.mode"] === "helm.chart") {
          await exec(shellDir + "/common/initialize-dependencies-helm.sh " + taskProps["kube.version"]);
        }

        log.ci("Retrieving Source Code");
        await exec(shellDir + '/common/git-clone.sh "' + taskProps["component/git.private.key"] + '" "' + taskProps["component/repoSshUrl"] + '" "' + taskProps["component/repoUrl"] + '" "' + taskProps["git.commit.id"] + '"');
        shell.cd("/data/workspace");
        if (taskProps["system.mode"] === "lib.jar" || taskProps["system.mode"] === "java") {
          if (!fileCommand.checkFileContainsStringWithProps("/data/workspace/pom.xml", "<plugins>", undefined, false)) {
            log.debug("No Maven plugins found, adding...");
            var replacementString = fs.readFileSync(shellDir + "/test/unit-java-maven-plugins.xml", "utf-8");
            fileCommand.replaceStringInFileWithProps("/data/workspace/pom.xml", "<plugins>", replacementString, undefined, false);
          }
          if (!fileCommand.checkFileContainsStringWithProps("/data/workspace/pom.xml", "<artifactId>jacoco-maven-plugin</artifactId>", undefined, false)) {
            log.debug("...adding jacoco-maven-plugin.");
            var replacementString = fs.readFileSync(shellDir + "/test/unit-java-maven-jacoco.xml", "utf-8");
            fileCommand.replaceStringInFileWithProps("/data/workspace/pom.xml", "<plugins>", replacementString, undefined, false);
          }
          if (!fileCommand.checkFileContainsStringWithProps("/data/workspace/pom.xml", "<artifactId>sonar-maven-plugin</artifactId>", undefined, false)) {
            log.debug("...adding sonar-maven-plugin.");
            var replacementString = fs.readFileSync(shellDir + "/test/unit-java-maven-sonar.xml", "utf-8");
            fileCommand.replaceStringInFileWithProps("/data/workspace/pom.xml", "<plugins>", replacementString, undefined, false);
          }
          if (!fileCommand.checkFileContainsStringWithProps("/data/workspace/pom.xml", "<artifactId>maven-surefire-report-plugin</artifactId>", undefined, false)) {
            log.debug("...adding maven-surefire-report-plugin.");
            var replacementString = fs.readFileSync(shellDir + "/test/unit-java-maven-surefire.xml", "utf-8");
            fileCommand.replaceStringInFileWithProps("/data/workspace/pom.xml", "<plugins>", replacementString, undefined, false);
          }
          if (testTypes.includes("static")) {
            log.debug("Commencing static tests");
            await exec(shellDir + "/test/static-java.sh " + taskProps["build.tool"] + " " + taskProps["version.name"] + " " + taskProps["global/sonar.url"] + " " + taskProps["global/sonar.api.key"] + " " + taskProps["system.component.id"] + " " + taskProps["system.component.name"] + " " + taskProps["sonar.exclusions"]);
          }
          if (testTypes.includes("unit")) {
            log.debug("Commencing unit tests");
            await exec(shellDir + "/test/initialize-dependencies-unit-java.sh");
            await exec(shellDir + "/test/unit-java.sh " + taskProps["build.tool"] + " " + taskProps["version.name"] + " " + taskProps["global/sonar.url"] + " " + taskProps["global/sonar.api.key"] + " " + taskProps["system.component.id"] + " " + taskProps["system.component.name"]);
          }
          if (testTypes.includes("security")) {
            log.debug("Commencing security tests");
            await exec(shellDir + "/test/initialize-dependencies-unit-java.sh");
            await exec(shellDir + "/test/initialize-dependencies-security-java.sh");
            await exec(shellDir + "/test/security-java.sh " + taskProps["system.component.name"] + " " + taskProps["version.name"] + " " + JSON.stringify(taskProps["global/asoc.repo.url"]) + " " + taskProps["global/asoc.repo.user"] + " " + taskProps["global/asoc.repo.password"] + " " + taskProps["global/asoc.app.id"] + " " + taskProps["global/asoc.login.key.id"] + " " + taskProps["global/asoc.login.secret"] + " " + taskProps["global/asoc.client.cli"] + " " + taskProps["global/asoc.java.runtime"]);
          }
        } else if (taskProps["system.mode"] === "nodejs") {
          if (testTypes.includes("static")) {
            log.debug("Commencing static tests");
            await exec(shellDir + "/test/static-node.sh " + taskProps["build.tool"] + " " + taskProps["version.name"] + " " + taskProps["global/sonar.url"] + " " + taskProps["global/sonar.api.key"] + " " + taskProps["system.component.id"] + " " + taskProps["system.component.name"]);
          }
          if (testTypes.includes("unit")) {
            log.debug("Commencing static tests");
            await exec(shellDir + "/test/unit-node.sh " + taskProps["build.tool"] + " " + taskProps["version.name"] + " " + taskProps["global/sonar.url"] + " " + taskProps["global/sonar.api.key"] + " " + taskProps["system.component.id"] + " " + taskProps["system.component.name"]);
          }
        } else if (taskProps["system.mode"] === "python") {
          if (testTypes.includes("static")) {
            log.debug("Commencing static tests");
            await exec(
              shellDir + "/test/initialize-dependencies-static-python.sh " + taskProps["language.version"] + " " + JSON.stringify(taskProps["global/pypi.registry.host"]) + " " + taskProps["global/pypi.repo.id"] + " " + taskProps["global/pypi.repo.user"] + " " + taskProps["global/pypi.repo.password"]
            );
            await exec(shellDir + "/test/static-python.sh " + taskProps["build.tool"] + " " + taskProps["version.name"] + " " + taskProps["global/sonar.url"] + " " + taskProps["global/sonar.api.key"] + " " + taskProps["system.component.id"] + " " + taskProps["system.component.name"]);
          }
          if (testTypes.includes("unit")) {
            log.debug("Not yet implemented");
          }
        } else if (taskProps["system.mode"] === "helm.chart") {
          if (testTypes.includes("static")) {
            log.debug("Linting Helm Chart(s)");
            await exec(shellDir + "/test/lint-helm.sh " + taskProps["global/helm.repo.url"] + " " + taskProps["helm.chart.directory"] + " " + taskProps["helm.chart.ignore"]);
          }
        }
      }
    } catch (e) {
      log.err("  Error encountered. Code: " + e.code + ", Message:", e.message);
      process.exit(1);
    } finally {
      await exec(shellDir + "/common/footer.sh");
      log.debug("Finished CICD Test Activity");
    }
  }
};
