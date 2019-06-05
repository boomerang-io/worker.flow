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
    log.debug("Inside Test Plugin");

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
      await exec(shellDir + '/test/initialize-dependencies.sh ' + taskProps['build.tool'] + ' ' + taskProps['build.tool.version']);
      log.ci("Retrieving Source Code");
      await exec(shellDir + '/common/git-clone.sh ' + taskProps['component/repoSshUrl'] + ' ' + taskProps['component/repoUrl'] + ' ' + taskProps['git.commit.id']);
      shell.cd("/data/workspace");
      fileCommand.checkFileContainsStringWithProps("/data/workspace/pom.xml", undefined, undefined, "<plugins>");
      fileCommand.checkFileContainsStringWithProps("/data/workspace/pom.xml", undefined, undefined, "<artifactId>jacoco-maven-plugin</artifactId>");
      fileCommand.replaceStringInFileWithProps("/data/workspace/pom.xml", undefined, undefined, "<plugins>", "<plugins>\nTEST\n");
      await exec("less /data/workspace/pom.xml");
      await exec(shellDir + '/common/footer.sh');
    } catch (e) {
      log.err("  Error encountered. Code: " + e.code + ", Message:", e.message);
      process.exit(1);
    } finally {
      log.debug("End Deploy Plugin");
    }

    log.debug("End Test Plugin");
  }
};
