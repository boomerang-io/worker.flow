#!/usr/bin/env node

const program = require('commander');
const log = require("./log.js");

//Import all Command Modules
var commands = require('require-all')({
  dirname     :  __dirname + '/commands',
  filter      :  /(.+)\.js$/,
  excludeDirs :  /^\.(git|svn)$/,
  recursive   : true
});

// var glob = require( 'glob' )
//   , path = require( 'path' );

// glob.sync( './commands/**/*.js' ).forEach( function( file ) {
//   require( path.resolve( file ) );
// });

//CLI Commands
program
  .version('0.1.0')
  .description('Boomerang Flow Worker CLI');

  program
  .command('sendSlackMessage <channel> <title> <message>')
  .description('Send Slack Webhook')
  .action((channel, title, message) => {
    log.sys("Initializing the Slack plugin");
    commands.slack.sendWebhook({channel, title, message});
  });

  program.parse(process.argv);