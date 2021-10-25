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
  if (!value) {
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

async function getData() {
  log.debug("Starting getData from Google Sheets task");

  const taskProps = utils.resolveInputParameters();
  const creds = getCredentials(taskProps);
  const sheets = google.sheets({ version: "v4", auth: getClient(creds) });
  const { spreadsheetId, range } = taskProps;
  assertExists(spreadsheetId, "Spreadsheet Id must be provided");
  assertExists(range, "Range must be provided");

  await sheets.spreadsheets.values
    .get({
      spreadsheetId,
      range
    })
    .then(body => {
      const values = JSON.stringify(body.data.values);
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

async function batchGetData() {
  log.debug("Starting batchGetData from Google Sheets task");

  const taskProps = utils.resolveInputParameters();
  const creds = getCredentials(taskProps);
  const sheets = google.sheets({ version: "v4", auth: getClient(creds) });
  const { spreadsheetId, ranges } = taskProps;
  assertExists(spreadsheetId, "Spreadsheet Id must be provided");
  assertExists(ranges, "Range must be provided");

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

  log.debug("Finished batchGetData Google Sheets task");
}

async function append() {
  log.debug("Starting append data to Google Sheets task");

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
        values
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

  log.debug("Finished append data to Google Sheets task");
}

module.exports = {
  append,
  batchGetData,
  getData
};
