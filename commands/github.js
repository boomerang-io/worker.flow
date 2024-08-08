import { log, params, results, result } from "@boomerang-io/task-core";
import { Octokit } from "@octokit/rest";
import { graphql } from "@octokit/graphql";
import moment from "moment";
import fs from "fs";
// https://octokit.github.io/rest.js/
import HttpsProxyAgent from "https-proxy-agent";

//Internal helper function
function validateMandatoryParameter(parameterValue, errorMessage) {
  if (!parameterValue) {
    log.err(errorMessage);
    process.exit(1);
  }
}

function protectAgainstEmpty(input) {
  if (input && typeof input === "string" && input === '""') {
    return undefined;
  }
  return input;
}

function setOutputs(outputFilePath, outputProperties) {
  if (
    outputFilePath &&
    outputFilePath.length &&
    outputFilePath !== '""' &&
    outputFilePath !== '" "'
  ) {
    fs.writeFileSync(
      outputFilePath,
      JSON.stringify(outputProperties),
      (err) => {
        if (err) {
          log.err(err);
          throw err;
        }
        log.good(
          "The task output parameter successfully saved to provided file path."
        );
      }
    );
  } else {
    await results(outputProperties);
    log.good(
      "The task output parameter successfully saved to standard response file."
    );
  }
}

async function setOutput(outputFilePath, outputKey, outputValue) {
  if (
    outputFilePath &&
    outputFilePath.length &&
    outputFilePath !== '""' &&
    outputFilePath !== '" "'
  ) {
    fs.writeFileSync(outputFilePath, JSON.stringify(outputValue), (err) => {
      if (err) {
        log.err(err);
        throw err;
      }
    });
    log.good(
      "The task output parameter successfully saved to provided file path ",
      outputFilePath
    );
  } else {
    await result(outputKey, outputValue);
    log.good(
      "The task output parameter successfully saved to standard response file."
    );
  }
}

function GetConfiguredClient(url, token) {
  let httpsAgent;
  if (process.env.HTTP_PROXY) {
    httpsAgent = new HttpsProxyAgent(process.env.HTTP_PROXY);
  } else {
    httpsAgent = undefined;
  }

  return new Octokit({
    auth: token,
    userAgent: "Boomerang Flow Joe Bot",
    baseUrl: url,
    log: console,
    request: {
      agent: httpsAgent,
    },
  });
}

async function RetrieveTeamByOrgName(url, token, organizationName, teamName) {
  try {
    const octokit = GetConfiguredClient(url, token);

    //Variable Checks
    if (!url) {
      log.err("URL has not been set");
      process.exit(1);
    }
    if (!token) {
      log.err("Token has not been set");
      process.exit(1);
    }
    if (!organizationName) {
      log.err("Organization name has not been set");
      process.exit(1);
    }
    if (!teamName) {
      log.err("Team name has not been set");
      process.exit(1);
    }
    let pageNumber = 0,
      returnedEntries = 0,
      teamFound = false;
    let team;
    do {
      pageNumber++;
      let data = {
        org: organizationName,
        per_page: "100",
        page: pageNumber,
      };
      await octokit.teams.list(data).then((body) => {
        log.debug("Successful response: ", body.data);
        returnedEntries = body.data.length;
        log.good("Successful retrieval of teams");
        log.debug("Searching for team name: ", teamName);
        foundTeam = Object.entries(body.data)
          .filter(
            (entry) => teamName === entry[1].name || teamName === entry[1].slug
          )
          .map((entry) => {
            log.debug(JSON.stringify(entry[1]));
            teamFound = true;
            return entry[1];
          });
        team = foundTeam[0];
        log.good("Team found:", JSON.stringify(team));
      });
    } while (returnedEntries > 0 && !teamFound);

    log.debug("Returning team found:", team);
    return team;
  } catch (error) {
    log.err(error);
    process.exit(1);
  }
}

async function GetRepository(url, token, owner, repository) {
  try {
    const octokit = GetConfiguredClient(url, token);

    //Variable Checks
    validateMandatoryParameter(url, "URL has not been set");
    validateMandatoryParameter(token, "Token has not been set");
    validateMandatoryParameter(owner, "Owner has not been set");
    validateMandatoryParameter(repository, "Repository has not been set");

    let data = {
      owner: owner,
      repo: repository,
    };
    let foundRepository;
    await octokit.repos.get(data).then((body) => {
      log.debug("Response Received:", body);
      foundRepository = body.data;
      log.good("Response successfully received!");
    });

    log.debug("Returning repository found:", foundRepository);
    return foundRepository;
  } catch (error) {
    log.err(error);
    process.exit(1);
  }
}

async function FindUsersByEmail(url, token, emailAddress) {
  try {
    const octokit = GetConfiguredClient(url, token);

    //Variable Checks
    if (!url) {
      log.err("URL has not been set");
      process.exit(1);
    }
    if (!token) {
      log.err("Token has not been set");
      process.exit(1);
    }
    if (!emailAddress) {
      log.err("Email address has not been set");
      process.exit(1);
    }
    let data = {
      q: emailAddress,
      per_page: "100",
    };
    let foundUsers;
    await octokit.search.users(data).then((body) => {
      log.debug("Successful response: ", body.data);
      returnedEntries = body.data.items.length;
      foundUsers = body.data.items;
      log.good("Users found:", JSON.stringify(foundUsers));
    });

    log.debug("Returning users found:", foundUsers);
    return foundUsers;
  } catch (error) {
    log.err(error);
    process.exit(1);
  }
}

export async function findReposInOrg() {
  log.debug("Started checkForRepos GitHub Plugin");

  //Destructure and get properties ready.
  const {
    url,
    token,
    org,
    visibility,
    skipRepos,
    numToRetrieve,
    outputFilePath,
  } = params;
  let skipReposArray;
  let httpsAgent;
  try {
    skipReposArray =
      skipRepos !== null && skipRepos != undefined ? skipRepos.split("\n") : [];
    if (process.env.HTTP_PROXY) {
      httpsAgent = new HttpsProxyAgent(process.env.HTTP_PROXY);
    } else {
      httpsAgent = undefined;
    }

    const octokit = new Octokit({
      auth: token,
      userAgent: "Boomerang Flow GitHub Bot",
      baseUrl: url,
      log: console,
      request: {
        agent: httpsAgent,
      },
    });
    let filteredRepos;
    await octokit.repos
      .listForOrg({
        org: org,
        type: visibility,
        per_page: numToRetrieve,
      })
      .then(({ data }) => {
        log.good("Successful retrieval of repositories.");
        log.debug("Repositories to skip:", skipReposArray);
        filteredRepos = Object.entries(data)
          .filter((entry) => !skipReposArray.includes(entry[1].name))
          .map((entry) => {
            log.debug(JSON.stringify(entry[1]));
            return entry[1].name;
          });
        log.good("Repositories:", filteredRepos);
        let outputProperties = {};
        outputProperties["repositories"] = filteredRepos;
        outputProperties["repositoriesPrettyPrint"] =
          "- " + filteredRepos.join("\n- ");

        setOutputs(outputFilePath, outputProperties);
      });
  } catch (error) {
    log.err(error);
    process.exit(1);
  }

  log.debug("Finished checkForRepos GitHub Plugin");
}
export async function makeReposInOrgPrivate() {
  log.debug("Started makeReposInOrgPrivate GitHub Plugin");

  const { url, token, org, repos } = params;
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
        agent: httpsAgent,
      },
    });
    const teamsDataRequests = Object.values(reposArray).map((repo) => {
      return octokit.repos
        .listTeams({
          owner: org,
          repo: repo,
        })
        .then((teamData) => {
          log.debug(teamData.data);
          return {
            ids: Object.values(teamData.data).map((team) => {
              log.debug("Found Id: ", team.id);
              return team.id;
            }),
            repo: repo,
          };
        });
    });
    const teamsData = await Promise.all(teamsDataRequests);
    log.good("Successful retrieval of repositories and team ids");
    const teamIdRequests = teamsData.map(({ ids, repo }) => {
      log.debug(ids, ":", repo);
      Object.values(ids).forEach((id) => {
        log.debug(id, ":", repo);
        return octokit.teams.createDiscussion({
          team_id: id,
          title: "Repository Marked As Private",
          body:
            "Your friendly neighborhood bot, Boomerang Joe, has marked **" +
            repo +
            "** as **private**.\n\n_If you have any questions or concerns please contact your Boomerang DevOps representative._",
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
}
export async function addUserToOrg() {
  log.debug("Started addUserToOrg GitHub Plugin");

  //Destructure and get properties ready.
  const { url, token, org, skipRepos, outputFilePath } = params;
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
        agent: httpsAgent,
      },
    });
    let filteredRepos;
    await octokit.repos
      .listForOrg({
        org: org,
        type: "public",
      })
      .then(({ data }) => {
        log.good("Successful retrieval of public repositories");
        log.debug("Repositories to skip:", skipReposArray);
        filteredRepos = Object.entries(data)
          .filter((entry) => !skipReposArray.includes(entry[1].name))
          .map((entry) => {
            log.debug(JSON.stringify(entry[1]));
            return entry[1].name;
          });
        log.good("Public Repositories:", filteredRepos);
        let outputProperties = {};
        outputProperties["repositories"] = JSON.stringify(filteredRepos);
        outputProperties["repositoriesPrettyPrint"] =
          "- " + filteredRepos.join("\n- ");

        setOutputs(outputFilePath, outputProperties);
      });
  } catch (error) {
    log.err(error);
    process.exit(1);
  }

  log.debug("Finished addUserToOrg GitHub Plugin");
}
export async function findInactiveIssuesInOrgAndLabel() {
  log.debug("Started findInactiveIssuesInOrgAndLabel() GitHub Plugin");
  // https://developer.github.com/v3/issues/#list-repository-issues

  //Destructure and get properties ready.
  const {
    url,
    token,
    org,
    repo,
    daysSinceActivity = 30,
    label = "stale",
    maxIssues = 30,
    ignoreLabel = "ignore",
  } = params;
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
        agent: httpsAgent,
      },
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
        per_page: maxIssues,
      })
      .then(({ data }) => {
        log.good("Successful retrieval of repositories");
        repos = Object.entries(data.items).map((entry) => {
          return {
            title: entry[1].title,
            number: entry[1].number,
            id: entry[1].id,
          };
        });
        log.good("Stale Repositories:", JSON.stringify(repos));
      });

    // TODO: not propery asynchronous, it should only do one label and one comment, then loop
    await repos.forEach((entry) => {
      octokit.issues.addLabels({
        owner: org,
        repo: repo,
        issue_number: entry.number,
        labels: [label],
      });
      octokit.issues.createComment({
        owner: org,
        repo: repo,
        issue_number: entry.number,
        body: message,
      });
      log.good("Labeled and commented on stale issue: ", entry.title);
    });
  } catch (error) {
    log.err(error);
    process.exit(1);
  }

  log.debug("Finished indInactiveIssuesInOrgAndLabel() GitHub Plugin");
}
export async function findIssuesInOrgAndRemove() {
  log.debug("Started findIssuesInOrgAndRemove() GitHub Plugin");

  //Destructure and get properties ready.
  const {
    url,
    token,
    org,
    repo,
    daysSinceActivity = 7,
    label = "stale",
    maxIssues = 30,
  } = params;
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
        agent: httpsAgent,
      },
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
        per_page: maxIssues,
      })
      .then(({ data }) => {
        log.good("Successful retrieval of repositories");
        repos = Object.entries(data.items).map((entry) => {
          return {
            title: entry[1].title,
            number: entry[1].number,
            id: entry[1].id,
          };
        });
        log.good("Stale Repositories:", JSON.stringify(repos));
      });

    // TODO: not propery asynchronous, it should only do one label and one comment, then loop
    await repos.forEach((entry) => {
      octokit.issues.createComment({
        owner: org,
        repo: repo,
        issue_number: entry.number,
        body: message,
      });
      octokit.issues.update({
        owner: org,
        repo: repo,
        issue_number: entry.number,
        state: "closed",
      });
      log.good("Commented and closed stale issue: ", entry.title);
    });
  } catch (error) {
    log.err(error);
    process.exit(1);
  }

  log.debug("Finished findIssuesInOrgAndRemove() GitHub Plugin");
}
export async function listAllOrganizations() {
  log.debug("Started listAllOrganizations() GitHub Plugin");

  //Destructure and get properties ready.
  const { url, token, since, maxNoOrg, outputFilePath } = params;
  try {
    const octokit = GetConfiguredClient(url, token);

    //Variable Checks
    validateMandatoryParameter(url, "URL has not been set");
    validateMandatoryParameter(token, "Token has not been set");
    let data = {};
    if (protectAgainstEmpty(since)) {
      data["since"] = since;
    }
    if (protectAgainstEmpty(maxNoOrg)) {
      data["per_page"] = maxNoOrg;
    }
    await octokit.orgs.list(data).then((body) => {
      log.debug("Response Received:", body);
      setOutput(outputFilePath, "organizations", body.data);
      log.good("Response successfully received!");
    });
  } catch (error) {
    log.err(error);
    process.exit(1);
  }
  log.debug("Finished listAllOrganizations() GitHub Plugin");
}
export async function getOrganization() {
  log.debug("Started getOrganization() GitHub Plugin");

  //Destructure and get properties ready.
  const { url, token, organizationName, outputFilePath } = params;
  try {
    const octokit = GetConfiguredClient(url, token);

    //Variable Checks
    validateMandatoryParameter(url, "URL has not been set");
    validateMandatoryParameter(token, "Token has not been set");
    validateMandatoryParameter(
      organizationName,
      "Organization name has not been set"
    );
    await octokit.orgs
      .get({
        org: organizationName,
      })
      .then((body) => {
        log.debug("Response Received:", body);
        setOutput(outputFilePath, "organization", body.data);
        log.good("Response successfully received!");
      });
  } catch (error) {
    log.err(error);
    process.exit(1);
  }
  log.debug("Finished getOrganization() GitHub Plugin");
}
export async function findTeamsInOrg() {
  log.debug("Started findTeamsInOrg() GitHub Plugin");

  //Destructure and get properties ready.
  const {
    url,
    token,
    organizationName,
    teamsPerPage,
    pageNumber,
    outputFilePath,
  } = params;
  try {
    const octokit = GetConfiguredClient(url, token);

    //Variable Checks
    validateMandatoryParameter(url, "URL has not been set");
    validateMandatoryParameter(token, "Token has not been set");
    validateMandatoryParameter(
      organizationName,
      "Organization name has not been set"
    );
    let data = {
      org: organizationName,
    };
    if (protectAgainstEmpty(teamsPerPage)) {
      data["per_page"] = teamsPerPage;
    }
    if (protectAgainstEmpty(pageNumber)) {
      data["page"] = pageNumber;
    }
    await octokit.teams.list(data).then((body) => {
      log.debug("Response Received:", body);
      setOutput(outputFilePath, "teams", body.data);
      log.good("Response successfully received!");
    });
  } catch (error) {
    log.err(error);
    process.exit(1);
  }
  log.debug("Finished findTeamsInOrg() GitHub Plugin");
}
export async function getTeamInOrgByName() {
  log.debug("Started getTeamInOrgByName() GitHub Plugin");

  //Destructure and get properties ready.
  const { url, token, organizationName, teamName, outputFilePath } = params;
  try {
    const octokit = GetConfiguredClient(url, token);

    //Variable Checks
    validateMandatoryParameter(url, "URL has not been set");
    validateMandatoryParameter(token, "Token has not been set");
    validateMandatoryParameter(
      organizationName,
      "Organization name has not been set"
    );
    validateMandatoryParameter(teamName, "Team name has not been set");
    let pageNumber = 0,
      returnedEntries = 0,
      teamFound = false;
    do {
      pageNumber++;
      let data = {
        org: organizationName,
        per_page: "100",
        page: pageNumber,
      };
      await octokit.teams.list(data).then((body) => {
        log.debug("Successful response: ", body.data);
        returnedEntries = body.data.length;
        log.good("Successful retrieval of teams");
        log.debug("Searching for team name: ", teamName);
        foundTeam = Object.entries(body.data)
          .filter(
            (entry) => teamName === entry[1].name || teamName === entry[1].slug
          )
          .map((entry) => {
            log.debug(JSON.stringify(entry[1]));
            teamFound = true;
            return entry[1];
          });
        log.good("Team found:", foundTeam);
        setOutput(outputFilePath, "team", foundTeam);
      });
    } while (returnedEntries > 0 && !teamFound);
  } catch (error) {
    log.err(error);
    process.exit(1);
  }
  log.debug("Finished getTeamInOrgByName() GitHub Plugin");
}
export async function deleteTeamByNameInOrg() {
  log.debug("Started deleteTeamByNameInOrg() GitHub Plugin");

  //Destructure and get properties ready.
  const { url, token, organizationName, teamName } = params;
  try {
    const octokit = GetConfiguredClient(url, token);

    //Variable Checks
    validateMandatoryParameter(url, "URL has not been set");
    validateMandatoryParameter(token, "Token has not been set");
    validateMandatoryParameter(
      organizationName,
      "Organization name has not been set"
    );
    validateMandatoryParameter(teamName, "Team name has not been set");

    const team = await RetrieveTeamByOrgName(
      url,
      token,
      organizationName,
      teamName
    );
    log.debug("Proceding with removing team: ", team);

    await octokit.teams
      .deleteInOrg({
        org: organizationName,
        team_slug: team.slug,
      })
      .then((body) => {
        log.debug("Successful delete team response: ", body);
        log.good("Successfully deleted the team!");
      });
  } catch (error) {
    log.err(error);
    process.exit(1);
  }
  log.debug("Finished deleteTeamByNameInOrg() GitHub Plugin");
}
export async function createTeamInOrg() {
  log.debug("Started createTeamInOrg() GitHub Plugin");

  //Destructure and get properties ready.
  const {
    url,
    token,
    organizationName,
    teamName,
    description,
    maintainers,
    repositoryNames,
    privacy,
    permission = "pull",
    parentTeamId,
    outputFilePath,
  } = params;
  try {
    const octokit = GetConfiguredClient(url, token);

    //Variable Checks
    validateMandatoryParameter(url, "URL has not been set");
    validateMandatoryParameter(token, "Token has not been set");
    validateMandatoryParameter(
      organizationName,
      "Organization name has not been set"
    );
    validateMandatoryParameter(teamName, "Team name has not been set");

    let data = {
      org: organizationName,
      name: teamName,
    };
    if (protectAgainstEmpty(permission)) {
      data["permission"] = permission;
    }
    if (protectAgainstEmpty(description)) {
      data["description"] = description;
    }
    if (protectAgainstEmpty(maintainers)) {
      data["maintainers"] = maintainers;
    }
    if (protectAgainstEmpty(repositoryNames)) {
      data["repo_names"] = repositoryNames;
    }
    if (protectAgainstEmpty(privacy)) {
      data["privacy"] = privacy;
    }
    if (protectAgainstEmpty(parentTeamId)) {
      data["parent_team_id"] = parentTeamId;
    }
    await octokit.teams.create(data).then((body) => {
      log.debug("Response Received:", body);
      setOutput(outputFilePath, "team", body.data);
      log.good("Response successfully received!");
    });
  } catch (error) {
    log.err(error);
    process.exit(1);
  }
  log.debug("Finished createTeamInOrg() GitHub Plugin");
}
export async function inviteMemberToTeamInOrg() {
  log.debug("Started inviteMemberToTeamInOrg() GitHub Plugin");

  //Destructure and get properties ready.
  const {
    url,
    token,
    organizationName,
    teamName,
    userEmail,
    role,
    outputFilePath,
  } = params;

  try {
    const octokit = GetConfiguredClient(url, token);

    //Variable Checks
    validateMandatoryParameter(url, "URL has not been set");
    validateMandatoryParameter(token, "Token has not been set");
    validateMandatoryParameter(
      organizationName,
      "Organization name has not been set"
    );
    validateMandatoryParameter(teamName, "Team name has not been set");
    validateMandatoryParameter(userEmail, "User Email has not been set");

    const team = await RetrieveTeamByOrgName(
      url,
      token,
      organizationName,
      teamName
    );

    log.debug("Proceding with looking-up the user by email: ", userEmail);
    const users = await FindUsersByEmail(url, token, userEmail);
    if (users.length != 1) {
      log.err("Number of users found based on email is not 1.");
      process.exit(1);
    }

    let data = {
      org: organizationName,
      team_slug: team.slug,
      username: users[0].login,
    };
    if (protectAgainstEmpty(role)) {
      data["role"] = role;
    }
    await octokit.teams.addOrUpdateMembershipForUserInOrg(data).then((body) => {
      log.debug("Successful add member to team response: ", body.data);
      setOutput(outputFilePath, "result", body.data);
      log.good("Successfully added organization member to a team!");
    });
  } catch (error) {
    log.err(error);
    process.exit(1);
  }
  log.debug("Finished inviteMemberToTeamInOrg() GitHub Plugin");
}
export async function removeMemberFromTeamInOrg() {
  log.debug("Started removeMemberFromTeamInOrg() GitHub Plugin");

  //Destructure and get properties ready.
  const { url, token, organizationName, teamName, userEmail } = params;
  try {
    const octokit = GetConfiguredClient(url, token);

    //Variable Checks
    validateMandatoryParameter(url, "URL has not been set");
    validateMandatoryParameter(token, "Token has not been set");
    validateMandatoryParameter(
      organizationName,
      "Organization name has not been set"
    );
    validateMandatoryParameter(teamName, "Team name has not been set");
    validateMandatoryParameter(userEmail, "User Email has not been set");

    const team = await RetrieveTeamByOrgName(
      url,
      token,
      organizationName,
      teamName
    );

    log.debug("Proceding with looking-up the user by email: ", userEmail);
    const users = await FindUsersByEmail(url, token, userEmail);
    if (users.length != 1) {
      log.err("Number of users found based on email is not 1.");
      process.exit(1);
    }

    let data = {
      org: organizationName,
      team_slug: team.slug,
      username: users[0].login,
    };
    await octokit.teams.removeMembershipForUserInOrg(data).then((body) => {
      log.debug("Successful remove team membership for a user: ", body);
      log.good("Successfully removed team membership for a user!");
    });
  } catch (error) {
    log.err(error);
    process.exit(1);
  }
  log.debug("Finished removeMemberFromTeamInOrg() GitHub Plugin");
}
export async function inviteMemberToOrg() {
  log.debug("Started inviteMemberToOrg() GitHub Plugin");

  //Destructure and get properties ready.
  const { url, token, organizationName, userEmail, role, outputFilePath } =
    params;
  try {
    const octokit = GetConfiguredClient(url, token);

    //Variable Checks
    validateMandatoryParameter(url, "URL has not been set");
    validateMandatoryParameter(token, "Token has not been set");
    validateMandatoryParameter(
      organizationName,
      "Organization name has not been set"
    );
    validateMandatoryParameter(userEmail, "User Email has not been set");

    log.debug("Proceding with looking-up the user by email: ", userEmail);
    const users = await FindUsersByEmail(url, token, userEmail);
    if (users.length != 1) {
      log.err("Number of users found based on email is not 1.");
      process.exit(1);
    }
    let data = {
      org: organizationName,
      username: users[0].login,
    };
    if (protectAgainstEmpty(role)) {
      data["role"] = role;
    }
    await octokit.orgs.setMembershipForUser(data).then((body) => {
      log.debug("Response Received:", body);
      setOutput(outputFilePath, "result", body.data);
      log.good("Response successfully received!");
    });
  } catch (error) {
    log.err(error);
    process.exit(1);
  }
  log.debug("Finished inviteMemberToOrg() GitHub Plugin");
}
export async function inviteCollaboratorToProject() {
  log.debug("Started inviteCollaboratorToProject() GitHub Plugin");

  //Destructure and get properties ready.
  const { url, token, repoURL, userEmail, permission = "pull" } = params;
  try {
    const octokit = GetConfiguredClient(url, token);

    //Variable Checks
    validateMandatoryParameter(url, "URL has not been set");
    validateMandatoryParameter(token, "Token has not been set");
    validateMandatoryParameter(repoURL, "Repository URL has not been set");
    validateMandatoryParameter(userEmail, "User Email has not been set");

    repoURLAtomsArray = repoURL !== null ? repoURL.split("/") : [];
    if (repoURLAtomsArray.length <= 1) {
      log.err("The repository URL is not a valid github repo url.");
      process.exit(1);
    }

    log.debug("Proceding with looking-up the user by email: ", userEmail);
    const users = await FindUsersByEmail(url, token, userEmail);
    if (users.length != 1) {
      log.err("Number of users found based on email is not 1.");
      process.exit(1);
    }
    let data = {
      owner: repoURLAtomsArray[repoURLAtomsArray.length - 2],
      repo: repoURLAtomsArray[repoURLAtomsArray.length - 1],
      username: users[0].login,
    };
    let collaboratorExists = false;
    octokit.hook.after("request", async (response) => {
      log.debug("response.status : ", response.status);
      if (response.status === 204) {
        collaboratorExists = true;
      }
    });
    octokit.hook.error("request", async (error) => {
      log.debug("error.status : ", error.status);
      if (error.status === 404) {
        collaboratorExists = false;
      }
    });
    await octokit.repos.checkCollaborator(data).then((body) => {
      log.debug("Check collaborator response received:", body);
    });
    log.good("Collaborator already exists: ", collaboratorExists);
    if (!collaboratorExists) {
      if (protectAgainstEmpty(permission)) {
        data["permission"] = permission;
      }
      await octokit.repos.addCollaborator(data).then((body) => {
        log.debug("Response Received:", body);
        log.good("Response successfully received!");
      });
    }
  } catch (error) {
    log.err(error);
    process.exit(1);
  }
  log.debug("Finished inviteCollaboratorToProject() GitHub Plugin");
}
export async function removeCollaboratorFromProject() {
  log.debug("Started removeCollaboratorFromProject() GitHub Plugin");

  //Destructure and get properties ready.
  const { url, token, repoURL, userEmail } = params;
  try {
    const octokit = GetConfiguredClient(url, token);

    //Variable Checks
    validateMandatoryParameter(url, "URL has not been set");
    validateMandatoryParameter(token, "Token has not been set");
    validateMandatoryParameter(repoURL, "Repository URL has not been set");
    validateMandatoryParameter(userEmail, "User Email has not been set");

    repoURLAtomsArray = repoURL !== null ? repoURL.split("/") : [];
    if (repoURLAtomsArray.length <= 1) {
      log.err("The repository URL is not a valid github repo url.");
      process.exit(1);
    }

    log.debug("Proceding with looking-up the user by email: ", userEmail);
    const users = await FindUsersByEmail(url, token, userEmail);
    if (users.length != 1) {
      log.err("Number of users found based on email is not 1.");
      process.exit(1);
    }
    let data = {
      owner: repoURLAtomsArray[repoURLAtomsArray.length - 2],
      repo: repoURLAtomsArray[repoURLAtomsArray.length - 1],
      username: users[0].login,
    };
    await octokit.repos.removeCollaborator(data).then((body) => {
      log.debug("Response Received:", body);
      log.good("Response successfully received!");
    });
  } catch (error) {
    log.err(error);
    process.exit(1);
  }
  log.debug("Finished removeCollaboratorFromProject() GitHub Plugin");
}
export async function getRepositoryFromRepoURL() {
  log.debug("Started getRepositoryFromRepoURL() GitHub Plugin");

  //Destructure and get properties ready.
  const { url, token, repoURL, outputFilePath } = params;
  try {
    const octokit = GetConfiguredClient(url, token);

    //Variable Checks
    validateMandatoryParameter(url, "URL has not been set");
    validateMandatoryParameter(token, "Token has not been set");
    validateMandatoryParameter(repoURL, "Repository URL has not been set");

    repoURLAtomsArray = repoURL !== null ? repoURL.split("/") : [];
    if (repoURLAtomsArray.length <= 1) {
      log.err("The repository URL is not a valid github repo url.");
      process.exit(1);
    }

    let data = {
      owner: repoURLAtomsArray[repoURLAtomsArray.length - 2],
      repo: repoURLAtomsArray[repoURLAtomsArray.length - 1],
    };
    await octokit.repos.get(data).then((body) => {
      log.debug("Successful get repo: ", body.data);
      setOutput(outputFilePath, "result", body.data);
      log.good("Response successfully received!");
    });
  } catch (error) {
    log.err(error);
    process.exit(1);
  }
  log.debug("Finished getRepositoryFromRepoURL() GitHub Plugin");
}
export async function addIssueToProject() {
  log.debug("Started addIssueToProject() GitHub Plugin");

  //Destructure and get properties ready.
  const { token, projectId, issueId } = params;
  try {
    //Variable Checks
    validateMandatoryParameter(token, "Token has not been set");
    validateMandatoryParameter(projectId, "Project ID has not been set");
    validateMandatoryParameter(issueId, "Issue ID has not been set");

    headersObject = {};
    headersObject["Authorization"] = `token ${token}`;
    headersObject["GraphQL-Features"] = "projects_next_graphql";
    headersObject["User-Agent"] = `Flowabl`;

    // TODO allow custom URLs
    // graphql = graphql.defaults({
    //   baseUrl: `${url}`,
    //   headers: headersObject,
    // });

    const result = await graphql({
      query: `mutation {addProjectNextItem(input: {projectId: \"${projectId}\" contentId: \"${issueId}\"}) {projectNextItem {id}}}`,
      headers: headersObject,
    });
    log.good("Response successfully received.", JSON.stringify(result));
    await result("result", result);
  } catch (error) {
    log.err(error);
    process.exit(1);
  }
  log.debug("Finished addIssueToProject() GitHub Plugin");
}
