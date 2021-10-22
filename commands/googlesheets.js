const { log, utils } = require("@boomerang-io/worker-core");
const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const CREDENTIAL_TYPE = "service_account";
const AUTH_URI = "https://accounts.google.com/o/oauth2/auth";
const TOKEN_URI = "https://oauth2.googleapis.com/token";
const AUTH_PROVIDER_CERT_URL = "https://www.googleapis.com/oauth2/v1/certs";

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

  const certURL = "https://www.googleapis.com/robot/v1/metadata/x509/" + encodeURIComponent(clientEmail);

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

async function getSheets() {
  const taskProps = utils.resolveInputParameters();
  const creds = getCredentials(taskProps);
  const sheets = google.sheets({ version: "v4", auth: getClient(creds) });
  const { spreadsheetId } = taskProps;
  assertExists(spreadsheetId, "Spreadsheet Id must be provided");
  const response = await sheets.spreadsheets.get({
    spreadsheetId
  });
  log.good(JSON.stringify(response.data));

  const getRows = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Sheet1"
  });
  log.good(JSON.stringify(getRows.data));
}

module.exports = {
  getSheets
};
