const { log, utils } = require("@boomerang-io/worker-core");
const { PythonShell } = require("python-shell");
const fs = require("fs");
const stringifier = require("properties/lib/stringifier");

function protectAgainstEmpty(input) {
  if (input && typeof input === "string" && input === '""') {
    return undefined;
  }
  return input;
}

module.exports = {
  execute() {
    log.debug("Inside Python Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.resolveInputParameters();
    const { pythonScript, args } = taskProps;

    if (!pythonScript) {
      log.err("Python script not been set");
      process.exit(1);
    }

    let options = {
      mode: "text",
      pythonOptions: ["-u"] // get print results in real-time
    };
    if (protectAgainstEmpty(args)) {
      options["args"] = args.split(" ");
    }
    fs.writeFileSync("/tmp/custom_script.py", pythonScript, err => {
      if (err) {
        log.err(err);
        throw err;
      }
      log.good("The python script was succesfully saved to the file!");
    });

    let pyshell = new PythonShell("/tmp/custom_script.py", options);
    pyshell.end(function(err, code, signal) {
      if (err) throw err;
      console.log("The exit code was: " + code);
      console.log("The exit signal was: " + signal);
      console.log("finished");
    });

    log.debug("End Python Plugin");
  }
};
