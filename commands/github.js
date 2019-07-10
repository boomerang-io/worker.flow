const log = require("../log.js");
const utils = require("../utils.js");
const Octokit = require('@octokit/rest');
const HttpsProxyAgent = require("https-proxy-agent");

module.exports = {
  async findPublicReposInOrg() {
    log.debug("Started checkForPublicRepos GitHub Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { url, token, org, skipRepos } = taskProps;

    try {
      skipReposArray = skipRepos !== null ? skipRepos.split("\n") : [];
      if (process.env.HTTP_PROXY) {
        httpsAgent = new HttpsProxyAgent(process.env.HTTP_PROXY);
      } else {
        httpsAgent = undefined;
      }

      const octokit = Octokit({
        auth: token,
        userAgent: 'Boomerang Flow Joe Bot v0.0.1',
        baseUrl: url,
        log: console,
        request: {
          agent: httpsAgent
        }
      })
      await octokit.repos.listForOrg({
        org: org,
        type: 'public'
      }).then(({ data }) => {
        log.good("Successful retrieval of public repositories");
        log.debug("Repositories to skip:", skipReposArray);
        filteredRepos = Object.entries(data)
          .filter(entry =>
            !skipReposArray.includes(entry[1].name)
          )
          .map(entry => {
            return entry[1].name;
          });
        log.good("Public Repositories:", filteredRepos);
        let outputProperties = {};
        outputProperties["repositories"] = JSON.stringify(filteredRepos);
        outputProperties["repositoriesPrettyPrint"] = "- " + filteredRepos.join("\n- ");
        utils.setOutputProperties(outputProperties);
      })
    } catch (error) {
      log.err(error);
      process.exit(1);
    }


    log.debug("Finished checkForPublicRepos GitHub Plugin");
  }
};
