const log = require("../log.js");
var filePath = require('path');
var fs = require("fs");
const utils = require("../utils.js");

module.exports = {
  createFile() {
    log.debug("Started Create File Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    log.debug(taskProps);
    const { path: path, content: content } = taskProps;

    try {
      fs.writeFile(path + '', content, err => {
        if (err) {
          log.err(err);
          throw err;
        }
        log.debug("The file was succesfully saved!");
      });
    } catch (e) {
      log.err(e);
      process.exit(1);
    }

    log.debug("Finished Create File Plugin");
  },
  readFileToProperty() {
    log.debug("Started Read Properties File Plugin");
    
    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    log.debug(taskProps);
    const { path: path, propertyName: propertyName } = taskProps;
    try {
      const file = fs.readFileSync(path);
      utils.setOutputProperty(propertyName, file);
      log.debug("The file was succesfully read!");
    } catch (e) {
      log.err(e);
      process.exit(1);
    }

    //TODO Update to catch and fail if file is not there or any other error
    //To get the container to show failure, we have to exit the process with process.exit(1);
    

    log.debug("Finished Read Properties File Plugin");
  },
  readPropertiesFile() {
    log.debug("Started Read Properties File Plugin");
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    log.debug(taskProps);
    const { path, delimiter = "=" } = taskProps;  
    const delimiterExpression = new RegExp(`${delimiter}(.+)`);

    try {
      const file = fs.readFileSync(path,"utf-8");

      const fileArray = file.split("\r\n");
      let fileObject = {};

      fileArray.forEach(file=>{
        let fileData = file.split(delimiterExpression);
        fileObject[fileData[0]] = fileData[1];
      });
      // utils.setOutputProperties(fileObject);
      log.debug("The file was succesfully read!");
    } catch (e) {
      log.err(e);
      process.exit(1);
    }

    //TODO
    //This method should read in a file of type properties file and parse every property (based on a delimiter, default is '=') and set as output properties.
    //This is similar functionality to our read properties method

    // //Destructure and get properties ready.
    // const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    // log.debug(taskProps);
    // const { filePath: filePath, fileContent: fileContent } = taskProps;

    // const file = fs.readFileSync(filePath);

    // utils.setOutputProperty("fileContent", file);

    log.debug("Finished Read Properties File Plugin");
  },
  checkFileOrFolderExists() {
    log.debug("Started Check File or Folder Exists Plugin");
      const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
      log.debug(taskProps);
      const { path, expression, propertyName } = taskProps;
      //Used to check if the path indicates a file or a directory
      const fileExtension = filePath.extname(path);
      try {
        //Search for files and directories that match the expression inside the path dir
        if(expression && !fileExtension){
          const regExp = new RegExp(expression);
          fs.readdir(path, (err,files) => {
            let filteredFiles = files.filter(file=>{
              return regExp.test(file);
            })
            if(filteredFiles.length === 0) throw new Error("Regex expression doesn't match any file.");
            else utils.setOutputProperty(propertyName, true);
          });
        }
        else {
          fs.stat(path, (err, stat) => {
            if(!stat) throw new Error("File not found.");
            else utils.setOutputProperty(propertyName, true);
          });
        }        
        log.debug("The file was succesfully read!");
      } catch (e) {
        log.err(e);
        process.exit(1);
      }
    log.debug("Finished Check File or Folder Exists Plugin");
  }
};
