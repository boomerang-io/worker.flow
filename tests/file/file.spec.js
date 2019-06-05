const { expect } = require("chai");
const { createFile, replaceStringInFile } = require("../../commands/file");
const fs = require("fs");

// use "props/test.task.input.properties" to control test props variables

describe("Create File", () => {
  it("Create a file", () => {
    createFile();
    expect(fs.existsSync("tests/file/testfile.txt")).to.be.true;
  });

  it("Created file has correct content", () => {
    const file = fs.readFileSync("tests/file/testfile.txt", "utf-8");
    expect(file.includes("pandas are adorable")).to.be.true;
  });
});

describe("Replace String in File", () => {
  it("Replace string in file", () => {
    replaceStringInFile();
    const file = fs.readFileSync("tests/file/testfile.txt", "utf-8");
    expect(file.includes("dogs are adorable")).to.be.true;
  });
});
