const log = require("../log.js");
const utils = require("../utils.js");
const { CICDError } = require('../error.js')
const shell = require("shelljs");
const fs = require("fs");
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
    log.debug("Inside Test Plugin");

    const taskProps = utils.resolveCICDTaskInputProps();
    const shellDir = "/cli/cicd";
    config = {
      verbose: true,
    }

    var testTypes = taskProps['test.type'].split(',');

    try {
      shell.cd("/data");
      if (taskProps['system.mode'] === "java.lib" || taskProps['system.mode'] === "java") {
        log.ci("Initializing Dependencies");
        await exec(shellDir + '/test/initialize-dependencies.sh ' + taskProps['build.tool'] + ' ' + taskProps['build.tool.version']);
      }
      log.ci("Retrieving Source Code");
      await exec(shellDir + '/common/git-clone.sh ' + taskProps['component/repoSshUrl'] + ' ' + taskProps['component/repoUrl'] + ' ' + taskProps['git.commit.id']);
      shell.cd("/data/workspace");
      if (taskProps['system.mode'] === "java.lib" || taskProps['system.mode'] === "java") {
        if (!fileCommand.checkFileContainsStringWithProps("/data/workspace/pom.xml", "<plugins>", undefined, false)) {
          log.debug("No Maven plugins found, adding...");
          var replacementString = fs.readFileSync(shellDir + '/test/unit-java-maven-plugins.xml', "utf-8");
          fileCommand.replaceStringInFileWithProps("/data/workspace/pom.xml", undefined, "<plugins>", replacementString, false);
        }
        if (!fileCommand.checkFileContainsStringWithProps("/data/workspace/pom.xml", "<artifactId>jacoco-maven-plugin</artifactId>", undefined, false)) {
          log.debug("...adding jacoco-maven-plugin.");
          var replacementString = fs.readFileSync(shellDir + '/test/unit-java-maven-jacoco.xml', "utf-8");
          fileCommand.replaceStringInFileWithProps("/data/workspace/pom.xml", undefined, "<plugins>", replacementString, false);
        }
        if (!fileCommand.checkFileContainsStringWithProps("/data/workspace/pom.xml", "<artifactId>sonar-maven-plugin</artifactId>", undefined, false)) {
          log.debug("...adding sonar-maven-plugin.");
          var replacementString = fs.readFileSync(shellDir + '/test/unit-java-maven-sonar.xml', "utf-8");
          fileCommand.replaceStringInFileWithProps("/data/workspace/pom.xml", undefined, "<plugins>", replacementString, false);
        }
        if (!fileCommand.checkFileContainsStringWithProps("/data/workspace/pom.xml", "<artifactId>maven-surefire-report-plugin</artifactId>", undefined, false)) {
          log.debug("...adding maven-surefire-report-plugin.");
          var replacementString = fs.readFileSync(shellDir + '/test/unit-java-maven-surefire.xml', "utf-8");
          fileCommand.replaceStringInFileWithProps("/data/workspace/pom.xml", undefined, "<plugins>", replacementString, false);
        }
        if (testTypes.includes("static")) {
          log.debug("Commencing static tests");
          await exec(shellDir + '/test/static-java.sh ' + taskProps['build.tool'] + ' ' + taskProps['version.name'] + ' ' + taskProps['global/sonar.url'] + ' ' + taskProps['global/sonar.api.key'] + ' ' + taskProps['system.component.id'] + ' ' + taskProps['system.component.name']);
        }
        if (testTypes.includes("unit")) {
          log.debug("Commencing unit tests");
          await exec(shellDir + '/test/unit-java.sh ' + taskProps['build.tool'] + ' ' + taskProps['version.name'] + ' ' + taskProps['global/sonar.url'] + ' ' + taskProps['global/sonar.api.key'] + ' ' + taskProps['system.component.id'] + ' ' + taskProps['system.component.name']);
        }
      } else if (taskProps['system.mode'] === "nodejs-nextgen") {
        if (testTypes.includes("static")) {
          log.debug("Commencing static tests");
          await exec(shellDir + '/test/static-node.sh ' + taskProps['build.tool'] + ' ' + taskProps['version.name'] + ' ' + taskProps['global/sonar.url'] + ' ' + taskProps['global/sonar.api.key'] + ' ' + taskProps['system.component.id'] + ' ' + taskProps['system.component.name']);
        }
      }
      await exec(shellDir + '/common/footer.sh');
    } catch (e) {
      log.err("  Error encountered. Code: " + e.code + ", Message:", e.message);
      process.exit(1);
    } finally {
      log.debug("End Test Plugin");
    }
  }
};
