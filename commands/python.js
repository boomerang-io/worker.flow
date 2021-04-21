const { log, utils } = require("@boomerang-io/worker-core");
const { PythonShell } = require("python-shell");
const fs = require("fs");
const execSync = require("child_process").execSync;

function protectAgainstEmpty(input) {
  if (input && typeof input === "string" && input === '""') {
    return undefined;
  }
  return input;
}

function saveContentToLocalFile(content, filePath) {
  fs.writeFileSync(filePath, content, err => {
    if (err) {
      log.err(err);
      throw err;
    }
    log.good("The file content was succesfully saved!");
  });

  return filePath;
}

module.exports = {
  execute() {
    log.debug("Inside Python Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.resolveInputParameters();
    const { pythonScript, pythonArguments, pythonRequirements } = taskProps;

    if (!pythonScript) {
      log.err("Python script not been set");
      process.exit(1);
    }

    let options = {
      mode: "text",
      pythonOptions: ["-u"] // get print results in real-time
    };
    if (protectAgainstEmpty(pythonArguments)) {
      options["args"] = pythonArguments.split(" ");
    }
    let fileTemp = "/tmp/custom_script.py";
    saveContentToLocalFile(pythonScript, fileTemp);
    log.debug("The python script was succesfully saved! File contents:\n", fs.readFileSync(fileTemp, "utf-8"));

    let okToRunScript = true;
    let reqTemp = "/tmp/requirements.txt";
    if (pythonRequirements) {
      saveContentToLocalFile(pythonRequirements, reqTemp);
      log.debug("The requirements file was succesfully saved! File contents:\n", fs.readFileSync(reqTemp, "utf-8"));
      execSync("pip3 install -r " + reqTemp, (error, stdout, stderr) => {
        if (error) {
          okToRunScript = false;
          console.log(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
      });
    }

    if (okToRunScript) {
      log.good("Pre-req met to rung python script!");
      let pyshell = new PythonShell(fileTemp, options);
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
    }

    log.debug("End Python Plugin");
  }
};
