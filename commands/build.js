const log = require("../log.js");
const utils = require("../utils.js");
const { CICDError } = require('../error.js')
const shell = require("shelljs");

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
    log.debug("Inside Build Plugin");

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
      await exec(shellDir + '/build/initialize-dependencies.sh ' + taskProps['build.tool'] + ' ' + taskProps['build.tool.version']);
      log.ci("Retrieving Source Code");
      await exec(shellDir + '/common/git-clone.sh ' + taskProps['component/repoSshUrl'] + ' ' + taskProps['component/repoUrl'] + ' ' + taskProps['git.commit.id']);
      shell.cd("/data/workspace");
      log.ci("Compile Artifact(s)");
      if (taskProps['system.mode'] === "java.lib") {
        await exec(shellDir + '/build/compile-jar.sh ' + taskProps['build.tool'] + ' ' + taskProps['build.tool.version'] + ' ' + taskProps['version.name']);
      } else {
        await exec(shellDir + '/build/compile.sh ' + taskProps['build.tool'] + ' ' + taskProps['build.tool.version'] + ' ' + taskProps['version.name']);
      }
      log.ci("Package");
      if (taskProps['system.mode'] === "java.lib") {
        log.debug("Packaging for Maven repository")
        await exec(shellDir + '/build/package-maven.sh ' + JSON.stringify(taskProps['global/maven.repo.url']) + ' ' + taskProps['global/maven.repo.id'] + ' ' + taskProps['global/artifactory.user'] + ' ' + taskProps['global/artifactory.password']);
      }
      if (taskProps['docker.enable']) {
        log.debug("Packaging for Docker registry")
        await exec(shellDir + '/build/package-docker.sh ' + taskProps['docker.image.name'] + ' ' + taskProps['version.name'] + ' ' + JSON.stringify(taskProps['team.name']) + ' ' + JSON.stringify(taskProps['global/container.registry.host']) + ' ' + taskProps['global/container.registry.port'] + ' ' + taskProps['global/container.registry.user'] + ' ' + taskProps['global/container.registry.password']);
      }
      await exec(shellDir + '/common/footer.sh');
    } catch (e) {
      log.err("  Error encountered. Code: " + e.code + ", Message:", e.message);
      process.exit(1);
    } finally {
      log.debug("End Build Plugin");
    }
  }
};
