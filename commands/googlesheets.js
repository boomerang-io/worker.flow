const { log, utils } = require("@boomerang-io/worker-core");
const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
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

function getClient(creds) {
  const client = google.auth.fromJSON(creds);
  client.scopes = SCOPES;

  return client;
}

async function create() {
  log.debug("Starting create Google Sheet task");

  const taskProps = utils.resolveInputParameters();
  const creds = getCredentials(taskProps);
  const sheets = google.sheets({ version: "v4", auth: getClient(creds) });
  const { title } = taskProps;
  assertExists(title, "Title must be provided");

  const resource = {
    properties: {
      title
    }
  };

  await sheets.spreadsheets
    .create({
      resource
    })
    .then(response => {
      const spreadsheet = JSON.stringify(response.data);
      log.sys("Response Received:", spreadsheet);
      utils.setOutputParameter("spreadsheet", spreadsheet);
      log.good("Response successfully received!");
    })
    .catch(err => {
      log.err(err);
      process.exit(1);
    });

  log.debug("Finished create Google Sheet task");
}

async function addSheet() {
  log.debug("Starting addSheet Google Sheets task");

  const taskProps = utils.resolveInputParameters();
  const creds = getCredentials(taskProps);
  const sheets = google.sheets({ version: "v4", auth: getClient(creds) });
  const { spreadsheetId, title } = taskProps;
  assertExists(spreadsheetId, "Spreadsheet Id must be provided");
  assertExists(title, "Title must be provided");

  const requestBody = {
    requests: [
      {
        addSheet: {
          properties: {
            title
          }
        }
      }
    ]
  };

  await sheets.spreadsheets
    .batchUpdate({
      spreadsheetId,
      requestBody
    })
    .then(response => {
      const spreadsheet = JSON.stringify(response.data);
      log.sys("Response Received:", spreadsheet);
      log.good("Successfully added sheet!");
    })
    .catch(err => {
      log.err(err);
      process.exit(1);
    });

  log.debug("Finished addSheet Google Sheets task");
}

async function deleteSheet() {
  log.debug("Starting deleteSheet Google Sheets task");

  const taskProps = utils.resolveInputParameters();
  const creds = getCredentials(taskProps);
  const sheets = google.sheets({ version: "v4", auth: getClient(creds) });
  const { spreadsheetId, sheetId } = taskProps;
  assertExists(spreadsheetId, "Spreadsheet Id must be provided");
  assertExists(sheetId, "Sheet Id must be provided");

  const requestBody = {
    requests: [
      {
        deleteSheet: {
          sheetId
        }
      }
    ]
  };

  await sheets.spreadsheets
    .batchUpdate({
      spreadsheetId,
      requestBody
    })
    .then(response => {
      const spreadsheet = JSON.stringify(response.data);
      log.sys("Response Received:", spreadsheet);
      log.good("Successfully deleted sheet!");
    })
    .catch(err => {
      log.err(err);
      process.exit(1);
    });

  log.debug("Finished deleteSheet Google Sheets task");
}

async function copySheetTo() {
  log.debug("Starting copySheetTo Google Sheets task");

  const taskProps = utils.resolveInputParameters();
  const creds = getCredentials(taskProps);
  const sheets = google.sheets({ version: "v4", auth: getClient(creds) });
  const { fromSpreadsheetId, sheetId, toSpreadsheetId } = taskProps;
  assertExists(fromSpreadsheetId, "The source spreadsheet Id must be provided");
  assertExists(toSpreadsheetId, "The destination spreadsheet Id must be provided");
  assertExists(sheetId, "Sheet Id must be provided");

  await sheets.spreadsheets.sheets
    .copyTo({
      sheetId,
      spreadsheetId: fromSpreadsheetId,
      requestBody: {
        destinationSpreadsheetId: toSpreadsheetId
      }
    })
    .then(response => {
      const spreadsheet = JSON.stringify(response.data);
      log.sys("Response Received:", spreadsheet);
      log.good("Successfully copied sheet!");
    })
    .catch(err => {
      log.err(err);
      process.exit(1);
    });

  log.debug("Finished copySheetTo Google Sheets task");
}

async function getData() {
  log.debug("Starting getData Google Sheets task");

  const taskProps = utils.resolveInputParameters();
  const creds = getCredentials(taskProps);
  const sheets = google.sheets({ version: "v4", auth: getClient(creds) });
  const { spreadsheetId, ranges } = taskProps;
  assertExists(spreadsheetId, "Spreadsheet Id must be provided");
  assertExists(ranges, "Ranges must be provided");

  await sheets.spreadsheets.values
    .batchGet({
      spreadsheetId,
      ranges: ranges.split(",")
    })
    .then(body => {
      const values = JSON.stringify(body.data.valueRanges.map(r => r.values).reduce((a, b) => a.concat(b), []));
      log.sys("Response Received:", values);
      utils.setOutputParameter("rows", values);
      log.good("Response successfully received!");
    })
    .catch(err => {
      log.err(err);
      process.exit(1);
    });

  log.debug("Finished getData Google Sheets task");
}

async function clearData() {
  log.debug("Starting clearData Google Sheets task");

  const taskProps = utils.resolveInputParameters();
  const creds = getCredentials(taskProps);
  const sheets = google.sheets({ version: "v4", auth: getClient(creds) });
  const { spreadsheetId, ranges } = taskProps;
  assertExists(spreadsheetId, "Spreadsheet Id must be provided");
  assertExists(ranges, "Ranges must be provided");

  await sheets.spreadsheets.values
    .batchClear({
      spreadsheetId,
      requestBody: {
        ranges: ranges.split(",")
      }
    })
    .then(body => {
      log.sys("Response Received:", JSON.stringify(body.data));
      log.good("Successfully removed data!");
    })
    .catch(err => {
      log.err(err);
      process.exit(1);
    });

  log.debug("Finished clearData Google Sheets task");
}

async function append() {
  log.debug("Starting append Google Sheets data task");

  const taskProps = utils.resolveInputParameters();
  const creds = getCredentials(taskProps);
  const sheets = google.sheets({ version: "v4", auth: getClient(creds) });
  const { spreadsheetId, range, values } = taskProps;
  assertExists(spreadsheetId, "Spreadsheet Id must be provided");
  assertExists(range, "Range must be provided");
  assertExists(values, "Values must be provided");

  await sheets.spreadsheets.values
    .append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: values.split("\n").map(s => s.split(";"))
      }
    })
    .then(body => {
      const response = JSON.stringify(body);
      log.sys("Response Received:", response);
      utils.setOutputParameter("response", response);
      log.good("Response successfully received!");
    })
    .catch(err => {
      log.err(err);
      process.exit(1);
    });

  log.debug("Finished append Google Sheets data task");
}

async function update() {
  log.debug("Starting update Google Sheets data task");

  const taskProps = utils.resolveInputParameters();
  const creds = getCredentials(taskProps);
  const sheets = google.sheets({ version: "v4", auth: getClient(creds) });
  const { spreadsheetId, range, values } = taskProps;
  assertExists(spreadsheetId, "Spreadsheet Id must be provided");
  assertExists(range, "Range must be provided");
  assertExists(values, "Values must be provided");

  await sheets.spreadsheets.values
    .update({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: values.split("\n").map(s => s.split(";"))
      }
    })
    .then(body => {
      const response = JSON.stringify(body.data);
      log.sys("Response Received:", response);
      utils.setOutputParameter("response", response);
      log.good("Response successfully received!");
    })
    .catch(err => {
      log.err(err);
      process.exit(1);
    });

  log.debug("Finished update Google Sheets data task");
}

module.exports = {
  addSheet,
  append,
  clearData,
  copySheetTo,
  create,
  deleteSheet,
  getData,
  update
};
