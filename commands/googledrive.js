import { log, params, results, result } from "@boomerang-io/task-core";
import { google } from "googleapis";

/**
 * checkIfEmpty - Check if param is set or not, in case of mandatory inputs
 * unsetField - Removes every property from object, with the name 'fieldName'
 * checkParameters - Validates all attributes of the supplied object. Returns true if all parameters are valid.
 * checkForJson - Validates the payload is JSON
 */
import { checkIfEmpty } from "../libs/utilities";

//Internal helper function
function assertExists(value, message) {
  if (value !== 0 && !value) {
    log.err(message);
    process.exit(1);
  }
}

/**
 * Create service account credentials object
 * @param {object} taskProps - Needs to contain privateKey and clientEmail
 * @description see https://developers.google.com/drive/api/v3/reference/files/copy?hl=en_GB#auth
 */
function getJwtClient(privateKey, clientEmail) {
  assertExists(privateKey, "Private Key must be provided");
  assertExists(clientEmail, "Client email must be provided");

  const jwtClient = new google.auth.JWT({
    email: clientEmail,
    key: privateKey.replace(new RegExp("\\\\n", "g"), "\n"),
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  return jwtClient;
}

export async function copyFile() {
  log.debug("Starting Copy File task");

  const { fileId, parents, fileName, privateKey, clientEmail } = params;
  const drive = google.drive({
    version: "v3",
    auth: getJwtClient(privateKey, clientEmail),
  });
  assertExists(fileId, "FileId must be provided");

  parentsArray = [];
  if (!checkIfEmpty(parents) && parents !== null) {
    parentsArray = parents.split("\n");
  }
  let requestBody = {
    parents: parentsArray,
  };
  if (!checkIfEmpty(fileName) && fileName !== null) {
    requestBody.name = fileName;
  }

  await drive.files
    .copy({
      fileId: fileId,
      fields:
        "id, name, parents, createdTime, modifiedTime, owners, permissions, shared, webViewLink",
      requestBody: requestBody,
    })
    .then(async (response) => {
      newFileId = response.data.id;
      log.debug("Response Received:", JSON.stringify(response.data));
      log.good("File successfully copied.");
      await results(response.data);
    })
    .catch((err) => {
      log.err(err);
      process.exit(1);
    });

  log.debug("Finished Copy File task");
}

export async function listFiles() {
  log.debug("Starting List Files task");

  const { query, privateKey, clientEmail } = params;
  const drive = google.drive({
    version: "v3",
    auth: getJwtClient(privateKey, clientEmail),
  });

  await drive.files
    .list({
      fields: "*",
      q: query,
    })
    .then(async (response) => {
      const data = JSON.stringify(response.data);
      log.sys("Response Received:", JSON.stringify(response.data));
      await result("result", data);
      log.good("Response successfully received!");
    })
    .catch((err) => {
      log.err(err);
      process.exit(1);
    });

  log.debug("Finished List Files task");
}

export async function listFilePermissions() {
  log.debug("Starting List File Permissions task");

  const { fileId, privateKey, clientEmail } = params;
  const drive = google.drive({
    version: "v3",
    auth: getJwtClient(privateKey, clientEmail),
  });
  assertExists(fileId, "FileID must be provided");

  await drive.permissions
    .list({
      fileId: fileId,
    })
    .then(async (response) => {
      log.sys("Response Received:", JSON.stringify(response.data));
      await result("permissions", JSON.stringify(response.data));
      log.good("Response successfully received!");
    })
    .catch((err) => {
      log.err(err);
      process.exit(1);
    });

  log.debug("Finished List File Permissions task");
}

export async function deleteFile() {
  log.debug("Starting Delete File task");

  const { fileId, privateKey, clientEmail } = params;
  const drive = google.drive({
    version: "v3",
    auth: getJwtClient(privateKey, clientEmail),
  });
  assertExists(fileId, "FileId must be provided");

  await drive.files
    .delete({
      fileId: fileId,
    })
    .then((response) => {
      // No data is provided in response of a successful deletion.
      log.debug("Status: " + response.status + " " + response.statusText);
      log.good("Response successfully received!");
    })
    .catch((err) => {
      log.err(err);
      process.exit(1);
    });

  log.debug("Finished Delete File task");
}
