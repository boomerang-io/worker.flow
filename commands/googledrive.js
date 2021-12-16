const { log, utils } = require("@boomerang-io/worker-core");
const { google } = require("googleapis");
const fs = require("fs");

const SCOPES = ["https://www.googleapis.com/auth/drive"];
const CREDENTIAL_TYPE = "service_account";
const AUTH_URI = "https://accounts.google.com/o/oauth2/auth";
const TOKEN_URI = "https://oauth2.googleapis.com/token";
const AUTH_PROVIDER_CERT_URL = "https://www.googleapis.com/oauth2/v1/certs";
const X_509_CERT_URL = "https://www.googleapis.com/robot/v1/metadata/x509/";

//Internal helper function
function assertExists(value, message) {
  if (value !== 0 && !value) {
    log.err(message);
    process.exit(1);
  }
}

// get service account auth credentials
function getCredentials(taskProps) {
  const { projectId, privateKeyId, privateKey, clientEmail, clientId } = taskProps;
  assertExists(projectId, "Project Id must be provided");
  assertExists(privateKeyId, "Private Key Id must be provided");
  assertExists(privateKey, "Private Key must be provided");
  assertExists(clientEmail, "Client email must be provided");
  assertExists(clientId, "Client Id must be provided");

  const certURL = X_509_CERT_URL + encodeURIComponent(clientEmail);

  const creds = {
    type: CREDENTIAL_TYPE,
    project_id: projectId,
    private_key_id: privateKeyId,
    private_key: privateKey,
    client_email: clientEmail,
    client_id: clientId,
    auth_uri: AUTH_URI,
    token_uri: TOKEN_URI,
    auth_provider_x509_cert_url: AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: certURL
  };

  return creds;
}

// TODO: merge with google sheets method to have it only in 1 place
function getClient(creds) {
  const client = google.auth.fromJSON(creds);
  client.scopes = SCOPES;

  return client;
}

async function list() {
  log.debug("Starting list Google Drive task");

  const taskProps = utils.resolveInputParameters();
  const creds = getCredentials(taskProps);
  const drive = google.drive({ version: "v3", auth: getClient(creds) });
  const { driveId } = taskProps;

  const corpora = driveId ? "drive" : "allDrives";

  await drive.files
    .list({
      corpora,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      orderBy: "folder,name",
      ...(driveId && { driveId: driveId })
    })
    .then(response => {
      const page = JSON.stringify(response.data);
      log.sys("Response Received:", page);
      utils.setOutputParameter("page", page);
      log.good("Response successfully received!");
    })
    .catch(err => {
      log.err(err);
      process.exit(1);
    });

  log.debug("Finished list Google Drive task");
}

async function shareWithUser() {
  log.debug("Starting shareWithUser Google Drive task");

  const taskProps = utils.resolveInputParameters();
  const creds = getCredentials(taskProps);
  const drive = google.drive({ version: "v3", auth: getClient(creds) });
  const { fileId, emailAddress, role } = taskProps;
  assertExists(fileId, "File id must be provided");
  assertExists(emailAddress, "Email address must be provided");
  /** 
    owner
    organizer
    fileOrganizer
    writer
    commenter
    reader
  */
  assertExists(role, "Role must be provided");

  const type = "user";
  await drive.permissions
    .create({
      fileId,
      requestBody: {
        type,
        role,
        emailAddress
      }
    })
    .then(response => {
      const permission = JSON.stringify(response.data);
      log.sys("Response Received:", permission);
      utils.setOutputParameter("permission", permission);
      log.good("Response successfully received!");
    })
    .catch(err => {
      log.err(err);
      process.exit(1);
    });

  log.debug("Finished shareWithUser Google Drive task");
}

async function upload() {
  log.debug("Starting upload Google Drive task");

  const taskProps = utils.resolveInputParameters();
  const creds = getCredentials(taskProps);
  const drive = google.drive({ version: "v3", auth: getClient(creds) });
  const { filePath, name, mimeType, parentFolderId } = taskProps;
  assertExists(filePath, "File path must be provided");
  assertExists(name, "Name must be provided");
  assertExists(mimeType, "MIME type must be provided");

  const media = {
    mimeType: mimeType,
    body: fs.createReadStream(filePath)
  };

  await drive.files
    .create({
      media,
      requestBody: {
        name,
        ...(parentFolderId && { parents: [parentFolderId] })
      }
    })
    .then(response => {
      const file = JSON.stringify(response.data);
      log.sys("Response Received:", file);
      utils.setOutputParameter("fileId", response.data.id);
      log.good("Response successfully received!");
    })
    .catch(err => {
      log.err(err);
      process.exit(1);
    });

  log.debug("Finished upload Google Drive task");
}

async function deleteFile() {
  log.debug("Starting deleteFile Google Drive task");

  const taskProps = utils.resolveInputParameters();
  const creds = getCredentials(taskProps);
  const drive = google.drive({ version: "v3", auth: getClient(creds) });
  const { fileId } = taskProps;
  assertExists(fileId, "File id must be provided");

  await drive.files
    .delete({
      fileId,
      supportsAllDrives: true
    })
    .then(response => {
      log.good("Response successfully received!");
    })
    .catch(err => {
      log.err(err);
      process.exit(1);
    });

  log.debug("Finished deleteFile Google Drive task");
}

async function moveToFolder() {
  log.debug("Starting moveToFolder Google Drive task");

  const taskProps = utils.resolveInputParameters();
  const creds = getCredentials(taskProps);
  const drive = google.drive({ version: "v3", auth: getClient(creds) });
  const { fileId, folderId } = taskProps;
  assertExists(fileId, "File id must be provided");
  assertExists(folderId, "Folder id must be provided");

  await drive.files
    .get({
      fileId,
      supportsAllDrives: true,
      fields: "parents"
    })
    .then(async file => {
      log.good("Successfully received file info!");
      await drive.files
        .update({
          fileId,
          addParents: folderId
        })
        .then(response => {
          log.good("Successfully added file!");
        })
        .catch(err => {
          log.err(err);
          process.exit(1);
        });
    })
    .catch(err => {
      log.err(err);
      process.exit(1);
    });

  log.debug("Finished moveToFolder Google Drive task");
}

async function addToFolder() {
  log.debug("Starting addToFolder Google Drive task");

  const taskProps = utils.resolveInputParameters();
  const creds = getCredentials(taskProps);
  const drive = google.drive({ version: "v3", auth: getClient(creds) });
  const { fileId, folderId } = taskProps;
  assertExists(fileId, "File id must be provided");
  assertExists(folderId, "Folder id must be provided");

  await drive.files
    .update({
      fileId,
      addParents: folderId
    })
    .then(response => {
      log.good("Successfully added file to folder!");
    })
    .catch(err => {
      log.err(err);
      process.exit(1);
    });

  log.debug("Finished addToFolder Google Drive task");
}

async function createFolder() {
  log.debug("Starting createFolder Google Drive task");

  const taskProps = utils.resolveInputParameters();
  const creds = getCredentials(taskProps);
  const drive = google.drive({ version: "v3", auth: getClient(creds) });
  const { name } = taskProps;
  assertExists(name, "Name must be provided");

  const media = {
    mimeType: "application/vnd.google-apps.folder"
  };

  await drive.files
    .create({
      media,
      requestBody: {
        name,
        ...(parentFolderId && { parents: [parentFolderId] })
      },
      fields: "id"
    })
    .then(response => {
      utils.setOutputParameter("folderId", response.data.id);
      log.good("Response successfully received!");
    })
    .catch(err => {
      log.err(err);
      process.exit(1);
    });

  log.debug("Finished createFolder Google Drive task");
}

module.exports = {
  list,
  shareWithUser,
  upload,
  deleteFile,
  moveToFolder,
  addToFolder,
  createFolder
};
