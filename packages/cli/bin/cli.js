#!/usr/bin/env node

process.on("unhandledRejection", (error) => {
  console.error(error);
});

const { log } = require("@boomerang-worker/core");

const currentNodeVersion = process.versions.node;
const semver = currentNodeVersion.split(".");
const major = semver[0];

if (major < 8) {
  log.err(
    `You are running Node ${currentNodeVersion}.\n` +
      `carbon-upgrade requires Node 8 or higher, please update your ` +
      `version of Node.`
  );
  process.exit(1);
}

const cli = require("../src/cli");

cli(process).catch((error) => {
  console.error(error);
  process.exit(1);
});
