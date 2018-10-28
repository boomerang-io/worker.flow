#!/usr/bin/env node

const program = require('commander');

program
  .version('0.1.0')
  .description('Boomerang Flow Worker CLI');

  program
  .command('sendSlack <channel> <message>')
  .description('Send Slack Message')
  .action((channel, message) => {
    sendSlack({channel, message});
  });

  program.parse(process.argv);