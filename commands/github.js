const { log, utils } = require("@boomerang-io/worker-core");
const { Octokit } = require("@octokit/rest");
const moment = require("moment");
// https://octokit.github.io/rest.js/
const HttpsProxyAgent = require("https-proxy-agent");

module.exports = {
  async findPublicReposInOrg() {
    log.debug("Started checkForPublicRepos GitHub Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.resolveInputParameters();
    const { url, token, org, skipRepos } = taskProps;
    let skipReposArray;
    let httpsAgent;
    try {
      skipReposArray = skipRepos !== null ? skipRepos.split("\n") : [];
      if (process.env.HTTP_PROXY) {
        httpsAgent = new HttpsProxyAgent(process.env.HTTP_PROXY);
      } else {
        httpsAgent = undefined;
      }

      const octokit = new Octokit({
        auth: token,
        userAgent: "Boomerang Flow Joe Bot",
        baseUrl: url,
        log: console,
        request: {
          agent: httpsAgent
        }
      });
      let filteredRepos;
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

    const taskProps = utils.resolveInputParameters();
    const { url, token, org, repos } = taskProps;
    let reposArray;
    let httpsAgent;

    try {
      reposArray = repos !== null ? repos.split("\n") : [];
      if (process.env.HTTP_PROXY) {
        httpsAgent = new HttpsProxyAgent(process.env.HTTP_PROXY);
      } else {
        httpsAgent = undefined;
      }

      const octokit = new Octokit({
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
            body: "Your friendly neighborhood bot, Boomerang Joe, has marked **" + repo + "** as **private**.\n\n_If you have any questions or concerns please contact your Boomerang DevOps representative._"
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
    const taskProps = utils.resolveInputParameters();
    const { url, token, org, skipRepos } = taskProps;
    let skipReposArray;
    let httpsAgent;

    try {
      skipReposArray = skipRepos !== null ? skipRepos.split("\n") : [];
      if (process.env.HTTP_PROXY) {
        httpsAgent = new HttpsProxyAgent(process.env.HTTP_PROXY);
      } else {
        httpsAgent = undefined;
      }

      const octokit = new Octokit({
        auth: token,
        userAgent: "Boomerang Flow Joe Bot",
        baseUrl: url,
        log: console,
        request: {
          agent: httpsAgent
        }
      });
      let filteredRepos;
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
  },
  async findInactiveIssuesInOrgAndLabel() {
    log.debug("Started findInactiveIssuesInOrgAndLabel() GitHub Plugin");
    // https://developer.github.com/v3/issues/#list-repository-issues

    //Destructure and get properties ready.
    const taskProps = utils.resolveInputParameters();
    const { url, token, org, repo, daysSinceActivity = 30, label = "stale", maxIssues = 30, ignoreLabel = "ignore" } = taskProps;
    let httpsAgent;
    try {
      if (process.env.HTTP_PROXY) {
        httpsAgent = new HttpsProxyAgent(process.env.HTTP_PROXY);
      } else {
        httpsAgent = undefined;
      }

      const octokit = new Octokit({
        auth: token,
        userAgent: "Boomerang Flow Joe Bot",
        baseUrl: url,
        log: console,
        request: {
          agent: httpsAgent
        }
      });
      let repos;
      let timestamp = moment()
        .subtract(daysSinceActivity, "days")
        .format("YYYY-MM-DD");
      log.debug("Stale Search Since Timestamp:", timestamp);
      let message = `:warning: This issue has had no activity in ${daysSinceActivity} days.<br/>Stale issues will be closed after an additional period of inactivity.<br/><br/>For any concern or feedback, please contact Boomerang Joe.`;
      log.debug("Stale Message:", message);

      query = `repo:${org}/${repo} is:open updated:<${timestamp} -label:${ignoreLabel}`;
      await octokit.search
        .issuesAndPullRequests({
          q: query,
          sort: "updated",
          order: "desc",
          per_page: maxIssues
        })
        .then(({ data }) => {
          log.good("Successful retrieval of repositories");
          repos = Object.entries(data.items).map(entry => {
            return {
              title: entry[1].title,
              number: entry[1].number,
              id: entry[1].id
            };
          });
          log.good("Stale Repositories:", JSON.stringify(repos));
        });

      // TODO: not propery asynchronous, it should only do one label and one comment, then loop
      await repos.forEach(entry => {
        octokit.issues.addLabels({
          owner: org,
          repo: repo,
          issue_number: entry.number,
          labels: [label]
        });
        octokit.issues.createComment({
          owner: org,
          repo: repo,
          issue_number: entry.number,
          body: message
        });
        log.good("Labeled and commented on stale issue: ", entry.title);
      });
    } catch (error) {
      log.err(error);
      process.exit(1);
    }

    log.debug("Finished indInactiveIssuesInOrgAndLabel() GitHub Plugin");
  },
  async findIssuesInOrgAndRemove() {
    log.debug("Started findIssuesInOrgAndRemove() GitHub Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.resolveInputParameters();
    const { url, token, org, repo, daysSinceActivity = 7, label = "stale", maxIssues = 30 } = taskProps;
    let httpsAgent;
    try {
      if (process.env.HTTP_PROXY) {
        httpsAgent = new HttpsProxyAgent(process.env.HTTP_PROXY);
      } else {
        httpsAgent = undefined;
      }

      const octokit = new Octokit({
        auth: token,
        userAgent: "Boomerang Flow Joe Bot",
        baseUrl: url,
        log: console,
        request: {
          agent: httpsAgent
        }
      });
      let repos;
      let timestamp = moment()
        .subtract(daysSinceActivity, "days")
        .format("YYYY-MM-DD");
      log.debug("Stale Search Since Timestamp:", timestamp);
      let message = `:exclamation: This issue has had no activity in a further ${daysSinceActivity} days.<br/>This issue will now be closed.<br/><br/>For any concern or feedback, please contact Boomerang Joe.`;
      log.debug("Stale Message:", message);

      query = `repo:${org}/${repo} is:open label:${label}`;
      // query = `repo:${org}/${repo} is:open label:${label} updated:<${staleTimestamp}`
      await octokit.search
        .issuesAndPullRequests({
          q: query,
          sort: "updated",
          order: "desc",
          per_page: maxIssues
        })
        .then(({ data }) => {
          log.good("Successful retrieval of repositories");
          repos = Object.entries(data.items).map(entry => {
            return {
              title: entry[1].title,
              number: entry[1].number,
              id: entry[1].id
            };
          });
          log.good("Stale Repositories:", JSON.stringify(repos));
        });

      // TODO: not propery asynchronous, it should only do one label and one comment, then loop
      await repos.forEach(entry => {
        octokit.issues.createComment({
          owner: org,
          repo: repo,
          issue_number: entry.number,
          body: message
        });
        octokit.issues.update({
          owner: org,
          repo: repo,
          issue_number: entry.number,
          state: "closed"
        });
        log.good("Commented and closed stale issue: ", entry.title);
      });
    } catch (error) {
      log.err(error);
      process.exit(1);
    }

    log.debug("Finished findIssuesInOrgAndRemove() GitHub Plugin");
  }
};
