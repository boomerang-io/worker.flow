const { log, utils } = require("@boomerang-io/worker-core");
const { PythonShell } = require("python-shell");
const fs = require("fs");

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
    fs.writeFileSync("custom_script.py", pythonScript, err => {
      if (err) {
        log.err(err);
        throw err;
      }
      log.good("The python script was succesfully saved to the file!");
    });

    let pyshell = new PythonShell("custom_script.py", options);
    //pyshell.send('hello');
    pyshell.on("message", function(message) {
      // received a message sent from the Python script (a simple "print" statement)
      console.log(message);
    });

    // end the input stream and allow the process to exit
    pyshell.end(function(err, code, signal) {
      if (err) throw err;
      console.log("The exit code was: " + code);
      console.log("The exit signal was: " + signal);
      console.log("finished");
    });

    log.debug("End Python Plugin");
  }
};
