#!/usr/bin/env node

const program = require("commander");
const log = require("./log.js");
const props = require("./props.js");

async function cli() {
  let inputProps;
  try {
    inputProps = await props.input();
    log.debug("Reading input props", inputProps);
  } catch (e) {
    log.warn(e);
  }

  //Import all Command Modules
  var commands = require("require-all")({
    dirname: __dirname + "/commands",
    filter: /(.+)\.js$/,
    excludeDirs: /^\.(git|svn)$/,
    recursive: true
  });

  //CLI Commands
  log.debug("Start of CLI commands");
  program.version("0.1.0").description("Boomerang Flow Worker CLI");

  program
    .command("sendSlackMessage <channel> <title> <message>")
    .description("Send Slack Webhook")
    .action((channel, title, message) => {
      log.sys("sendSlackMessage", channel, title, message);
      commands.slack.sendWebhook({ channel, title, message });
    });

  program
    .command("sendMailToMember <to> <subject> <message>")
    .description("Send Email to Member with Subject and Message")
    .action((to, subject, message) => {
      log.sys("sendMailToMember ", to, subject, message);
      commands.mail.sendMailToMember({ to, subject, message });
    });

  program
    .command("sleep <duration>")
    .description("Sleep for specified duration in milliseconds")
    .action(duration => {
      log.sys("sleep ", duration);
      commands.sleep.sleep({ duration });
    });

  program
    .command("artifactoryDownload ")
    .description("Download file from Artifactory")
    .action(() => {
      log.sys("artifactoryDownload");
      commands.artifactory.downloadFile({}, inputProps);
    });

  program
    .command("createFile <filePath> <fileContent>")
    .description("Download file from Artifactory")
    .action((filePath, fileContent) => {
      log.sys("createFile", filePath, fileContent);
      commands.file.createFile({ filePath, fileContent }, inputProps);
    });

  program.parse(process.argv);
}

cli();

//TODO: Write out to props
