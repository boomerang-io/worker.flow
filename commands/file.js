import { log, params, results, result } from "@boomerang-io/task-core";
import filePath from "path";
import fs from "fs";
import properties from "properties";

/**
 * -task input props are coming in now as empty quotations
 * instead of checking if the prop is null, we must check to make sure that it
 * is not empty quotations
 * @param {string} str - string value to check for special empty edges cases
 */
const checkForEmptyInputStringHelper = (str) => {
  return str !== '""' && str !== '" "' && str !== null && str !== undefined;
};

const replaceTokensInFileWithProps = async function (
  path,
  files,
  tokenStartDelimiter,
  tokenEndDelimiter,
  replaceTokenMap,
  filenameSearchFlags,
  tokenSearchFlags,
  failIfNotFound
) {
  const testFilename = (file, fileName) => {
    let expression;
    if (file.startsWith("/") && file.lastIndexOf("/") > 0) {
      const lastSlash = file.lastIndexOf("/");
      expression = new RegExp(
        file.slice(1, lastSlash),
        file.slice(lastSlash + 1)
      );
    } else {
      expression = new RegExp(file, filenameSearchFlags);
    }
    return expression.test(fileName);
  };

  try {
    const allFileNames = fs.readdirSync(path);
    log.debug("Files in Path: ", allFileNames);
    let replaceFileNames = [];
    if (Array.isArray(files)) {
      allFileNames.forEach((fileName) =>
        files.forEach((file) => {
          if (testFilename(file, fileName)) {
            replaceFileNames.push(fileName);
          }
        })
      );
    } else {
      allFileNames.forEach((fileName) => {
        if (testFilename(files, fileName)) {
          replaceFileNames.push(fileName);
        }
      });
    }
    log.debug("All matching files: ", replaceFileNames);

    if (failIfNotFound && replaceFileNames.length === 0)
      throw new Error("Not found any matches.");

    const allFilePaths = replaceFileNames.map((fileName) =>
      filePath.join(path, fileName)
    );
    const allFileContents = allFilePaths.map((fileDir) =>
      fs.readFileSync(fileDir, "utf-8")
    );

    const newFileContents = allFileContents.map((fileContent) => {
      let file = fileContent;
      Object.keys(replaceTokenMap).forEach((tokenKey) => {
        log.debug(
          "Attempting token replacement. Token key: ",
          tokenKey,
          ", Token value: ",
          replaceTokenMap[tokenKey]
        );
        const expression = new RegExp(
          `(${tokenStartDelimiter})(${tokenKey})(${tokenEndDelimiter})`,
          tokenSearchFlags
        );
        file = file.replace(expression, replaceTokenMap[tokenKey]);
      });
      return file;
    });

    allFilePaths.forEach((fileDir, index) => {
      log.sys("New File Conents - ", fileDir, "\n", newFileContents[index]);
      fs.writeFileSync(fileDir, newFileContents[index], "utf-8");
    });

    return allFilePaths;
  } catch (e) {
    log.err(e);
    process.exit(1);
  }
};

export function createFile() {
  //Create file on file system
  log.debug("Started Create File Plugin");

  const { path, content, createDir } = params;

  try {
    if (createDir) {
      fs.mkdirSync(filePath.dirname(path), { recursive: true }, (err) => {
        if (err) throw err;
      });
    } else {
    }
    fs.writeFileSync(path + "", content, (err) => {
      if (err) {
        log.err(err);
        throw err;
      }
      log.good(
        "The file was succesfully saved! File contents:\n",
        fs.readFileSync(path, "utf-8")
      );
    });
  } catch (e) {
    if (e.code == "ENOENT") {
      log.warn(
        "Directory did not exist. If you enable Directory Creation on task we can create the path to file"
      );
    }
    log.err(e);
    process.exit(1);
  }

  log.debug("Finished Create File Plugin");
}
export async function readFileToProperty() {
  //Read in a file and set contents as an output property
  log.debug("Started Read File to Property Plugin");

  const { path: path } = params;
  try {
    const file = fs.readFileSync(path, "utf8");
    await result("content", file);
    log.good("The file was succesfully read!");
  } catch (e) {
    log.err(e);
    process.exit(1);
  }

  log.debug("Finished Read File to Property Plugin");
}
export async function readPropertiesFromFile() {
  //Read in a file of type properties file and parse every property (based on a delimiter, default being '=') and set as output properties.
  log.debug("Started Read Properties From File Plugin");

  const { path, delimiter = "=" } = params;
  const delimiterExpression = new RegExp(`${delimiter}(.+)`);

  try {
    const file = fs.readFileSync(path, "utf-8");

    let fileArray = file.split("\n");
    if (file.includes("\r\n")) {
      fileArray = file.split("\r\n");
    }
    let fileObject = {};

    fileArray.forEach((file) => {
      let fileData = file.split(delimiterExpression);
      fileObject[fileData[0]] = fileData[1];
    });
    await results(fileObject);
    log.good("The file was succesfully read!");
  } catch (e) {
    log.err(e);
    process.exit(1);
  }

  log.debug("Finished Read Properties From File Plugin");
}
export function checkFileOrFolderExists() {
  //Return true if file or folder exists based on regular expression
  log.debug("Started Check File or Folder Exists Plugin");

  const { path, expression } = params;

  const fileExtension = filePath.extname(path);
  try {
    //Search for files and directories that match the expression inside the path dir
    if (checkForEmptyInputStringHelper(expression) && !fileExtension) {
      const regExp = new RegExp(expression);
      fs.readdirSync(path, (err, files) => {
        let filteredFiles = files.filter((file) => {
          return regExp.test(file);
        });
        if (filteredFiles.length === 0)
          throw new Error("Regex expression doesn't match any file.");
      });
    } else {
      fs.statSync(path, (err, stat) => {
        if (!stat) throw new Error("File not found.");
      });
    }
    log.good("The file/directory was found!");
  } catch (e) {
    log.err(e);
    process.exit(1);
  }

  log.debug("Finished Check File or Folder Exists Plugin");
}

export function checkFileContainsString() {
  // Check if a file contains string or matches regular expression
  log.debug("Started Check File Contains String Plugin");

  const { path, expression, flags, failIfNotFound = false } = params;

  try {
    const file = fs.readFileSync(path, "utf-8");
    let result;

    const fileExpression = new RegExp(
      expression,
      checkForEmptyInputStringHelper(flags) ? flags : undefined
    );
    result = fileExpression.test(file);

    if (failIfNotFound && !result) {
      throw new Error("Not found any matches.");
    }
    log.good("The expression has been found in the file");
  } catch (e) {
    log.err(e);
    process.exit(1);
  }

  log.debug("Finished Check File Contains String Plugin");
}
export function replaceStringInFile() {
  // Replace string in file finding by string or regular expression
  log.debug("Started Replace String In File Plugin");

  const {
    path,
    expression,
    replaceString,
    flags,
    failIfNotFound = false,
  } = params;

  try {
    const file = fs.readFileSync(path, "utf-8");
    let result;

    const fileExpression = new RegExp(
      expression,
      checkForEmptyInputStringHelper(flags) ? flags : undefined
    );
    if (failIfNotFound && !fileExpression.test(file))
      throw new Error("No matches found!");
    result = file.replace(fileExpression, replaceString);

    fs.writeFileSync(path, result, "utf-8");
    log.good("The string has been replaced!");
  } catch (e) {
    log.err(e);
    process.exit(1);
  }

  log.debug("Finished Replace String In File Plugin");
}
export async function replaceTokensInFile() {
  log.debug("Started Replace Tokens in File Plugin");

  const {
    path,
    files,
    tokenStartDelimiter = "@", // need to use double escape "\\" before special characters like "$", otherwise the regex search will fail
    tokenEndDelimiter = "@",
    allParams,
    filenameSearchFlags = "g",
    tokenSearchFlags = "g",
    failIfNotFound = false,
  } = params;

  var allParamsDecoded = {};
  var options = {
    comments: "#",
    separators: "=",
    strict: true,
    reviver: function (key, value) {
      if (key != null && value == null) {
        return "";
      } else {
        //Returns all the lines
        return this.assert();
      }
    },
  };

  allParamsBuffer = Buffer.from(allParams, "base64").toString("utf-8");
  if (
    !allParamsBuffer ||
    0 === allParamsBuffer.length ||
    "��" === allParamsBuffer
  ) {
    // allParamsDecoded = properties.parse(allParams.substring(1).substring(0, allParams.length), options);
    allParamsDecoded = properties.parse(allParams, options);
  } else {
    allParamsDecoded = properties.parse(allParamsBuffer, options);
  }
  log.debug("allParamsDecoded:", allParamsDecoded);
  var replacedFiles = await replaceTokensInFileWithProps(
    path,
    files,
    tokenStartDelimiter,
    tokenEndDelimiter,
    allParamsDecoded,
    filenameSearchFlags,
    tokenSearchFlags,
    failIfNotFound
  );

  await result("files", replacedFiles.toString());

  log.debug("Finished Replace Tokens in File Plugin");
}
