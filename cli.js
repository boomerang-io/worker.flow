#!/usr/bin/env node

const program = require("commander");
const log = require("./log.js");
const props = require("./utils.js");
require("dotenv").config();

async function cli() {
  // MOVED TO UTILS.JS
  // let inputProps;
  // try {
  //   //inputProps = await props.input();
  //   //log.debug("Reading input props", inputProps);
  // } catch (e) {
  //   log.warn(e);
  // }

  //Import all Command Modules
  var commands = require("require-all")({
    dirname: __dirname + "/commands",
    filter: /(.+)\.js$/,
    excludeDirs: /^\.(git|svn)$/,
    recursive: true
  });

  //Env Variables
  //TODO: change implement to pull from inputs.props or some file on load
  //log.debug("Environment Variables: ");
  //TODO: update log to be able to handle process.env
  //console.log(process.env);

  //CLI Commands
  log.debug("Start of CLI commands");
  program.version("0.1.7").description("Boomerang Flow Worker CLI");

  program
    .arguments("<cmd> <method>")
    .description("Send Slack Webhook")
    .action((cmd, method) => {
      log.sys(cmd);
      commands[cmd][method]();
    });

  // DEPRECATED FOR ABOVE GENERIC METHOD
  // program
  //   .command("sendSlackMessage <channel> <title> <message>")
  //   .description("Send Slack Webhook")
  //   .action((channel, title, message) => {
  //     log.sys("sendSlackMessage", channel, title, message);
  //     commands.slack.sendWebhook({ channel, title, message });
  //   });

  // program
  //   .command("sendMailToMember <to> <subject> <message>")
  //   .description("Send Email to Member with Subject and Message")
  //   .action((to, subject, message) => {
  //     log.sys("sendMailToMember ", to, subject, message);
  //     commands.mail.sendMailToMember({ to, subject, message });
  //   });

  // program
  //   .command("sleep <duration>")
  //   .description("Sleep for specified duration in milliseconds")
  //   .action(duration => {
  //     log.sys("sleep ", duration);
  //     commands.sleep.sleep({ duration });
  //   });

  // program
  //   .command("artifactoryDownload")
  //   .description("Download file from Artifactory")
  //   .action(() => {
  //     log.sys("artifactoryDownload");
  //     commands.artifactory.downloadFile({}, inputProps);
  //   });

  // program
  //   .command("artifactoryUpload <filePath>")
  //   .description("Upload file from Artifactory")
  //   .action(filePath => {
  //     log.sys("artifactoryUpload", filePath);
  //     commands.artifactory.uploadFile({ filePath }, inputProps);
  //   });

  // program
  //   .command("createFile <filePath> <fileContent>")
  //   .description("Create File")
  //   .action((filePath, fileContent) => {
  //     log.sys("createFile", filePath, fileContent);
  //     commands.file.createFile({ filePath, fileContent }, inputProps);
  //   });

  program.parse(process.argv);
}

cli();

//TODO: Write out to props
