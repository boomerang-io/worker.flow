import { log, params } from "@boomerang-io/task-core";
import shelljs from "shelljs";

export function execute() {
  log.debug("Inside Shell Plugin");
  log.debug("Params: ", JSON.stringify(params, null, 2));
  const { path, shell, script } = params;

  let dir;
  if (!path || path === '""') {
    log.debug("No directory specified. Defaulting to /data...");
    dir = "/data";
  } else {
    dir = path;
  }
  shelljs.config.silent = true; //set to silent otherwise CD will print out no such file or directory if the directory doesn't exist
  shelljs.cd(dir);
  //shelljs.cd -> does not have an error handling call back and will default to current directory
  if (shelljs.pwd().toString() !== dir.toString()) {
    log.err("No such file or directory:", dir);
    return process.exit(1);
  }
  shelljs.config.silent = false;

  let config = {
    verbose: false,
  };
  if (!shell || shell === '""') {
    log.debug("No shell interpreter specified. Defaulting...");
  } else {
    config.shell = shell;
  }
  log.debug("Script to execute:", script);
  shelljs.exec(script, config, function (code, stdout, stderr) {
    if (code != 0) {
      log.err("  Exit code:", code);
      log.err("  Program stderr:", stderr);
      return process.exit(code);
    }
  });

  log.debug("End Shell Plugin");
}
