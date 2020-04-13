const { log, utils } = require("@boomerang-worker/core");
const Octokit = require("@octokit/rest");
// https://octokit.github.io/rest.js/
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
        userAgent: "Boomerang Flow Joe Bot",
        baseUrl: url,
        log: console,
        request: {
          agent: httpsAgent
        }
      });
      await octokit.repos
        .listForOrg({
          org: org,
          type: "public"
        })
        .then(({ data }) => {
          log.good("Successful retrieval of public repositories");
          log.debug("Repositories to skip:", skipReposArray);
          filteredRepos = Object.entries(data)
            .filter(entry => !skipReposArray.includes(entry[1].name))
            .map(entry => {
              log.debug(JSON.stringify(entry[1]));
              return entry[1].name;
            });
          log.good("Public Repositories:", filteredRepos);
          let outputProperties = {};
          outputProperties["repositories"] = JSON.stringify(filteredRepos);
          outputProperties["repositoriesPrettyPrint"] = "- " + filteredRepos.join("\n- ");
          utils.setOutputProperties(outputProperties);
        });
    } catch (error) {
      log.err(error);
      process.exit(1);
    }

    log.debug("Finished checkForPublicRepos GitHub Plugin");
  },
  async makeReposInOrgPrivate() {
    log.debug("Started makeReposInOrgPrivate GitHub Plugin");

    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { url, token, org, repos } = taskProps;

    try {
      reposArray = repos !== null ? repos.split("\n") : [];
      if (process.env.HTTP_PROXY) {
        httpsAgent = new HttpsProxyAgent(process.env.HTTP_PROXY);
      } else {
        httpsAgent = undefined;
      }

      const octokit = Octokit({
        auth: token,
        userAgent: "Boomerang Flow Joe Bot",
        baseUrl: url,
        log: console,
        request: {
          agent: httpsAgent
        }
      });
      const teamsDataRequests = Object.values(reposArray).map(repo => {
        return octokit.repos
          .listTeams({
            owner: org,
            repo: repo
          })
          .then(teamData => {
            log.debug(teamData.data);
            return {
              ids: Object.values(teamData.data).map(team => {
                log.debug("Found Id: ", team.id);
                return team.id;
              }),
              repo: repo
            };
          });
      });
      const teamsData = await Promise.all(teamsDataRequests);
      log.good("Successful retrieval of repositories and team ids");
      const teamIdRequests = teamsData.map(({ ids, repo }) => {
        log.debug(ids, ":", repo);
        Object.values(ids).forEach(id => {
          log.debug(id, ":", repo);
          return octokit.teams.createDiscussion({
            team_id: id,
            title: "Repository Marked As Private",
            body:
              "Your friendly neighborhood bot, Boomerang Joe, has marked **" +
              repo +
              "** as **private**.\n\n_If you have any questions or concerns please contact your Boomerang DevOps representative._"
          });
        });
        // TODO: if you get back a 404 it means the Access Token doesn't have permissions to teams.
      });

      // dispatch all of the promises asynchronously
      await Promise.all(teamIdRequests);
    } catch (error) {
      log.err(error);
      process.exit(1);
    }

    log.debug("Finished makeReposInOrgPrivate GitHub Plugin");
  },
  async addUserToOrg() {
    log.debug("Started addUserToOrg GitHub Plugin");

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
        userAgent: "Boomerang Flow Joe Bot",
        baseUrl: url,
        log: console,
        request: {
          agent: httpsAgent
        }
      });
      await octokit.repos
        .listForOrg({
          org: org,
          type: "public"
        })
        .then(({ data }) => {
          log.good("Successful retrieval of public repositories");
          log.debug("Repositories to skip:", skipReposArray);
          filteredRepos = Object.entries(data)
            .filter(entry => !skipReposArray.includes(entry[1].name))
            .map(entry => {
              log.debug(JSON.stringify(entry[1]));
              return entry[1].name;
            });
          log.good("Public Repositories:", filteredRepos);
          let outputProperties = {};
          outputProperties["repositories"] = JSON.stringify(filteredRepos);
          outputProperties["repositoriesPrettyPrint"] = "- " + filteredRepos.join("\n- ");
          utils.setOutputProperties(outputProperties);
        });
    } catch (error) {
      log.err(error);
      process.exit(1);
    }

    log.debug("Finished addUserToOrg GitHub Plugin");
  }
};
