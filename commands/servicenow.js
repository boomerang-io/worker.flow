import { log, params, results } from "@boomerang-io/task-core";
import fetch from "node-fetch";
import HttpsProxyAgent from "https-proxy-agent";

async function getTagID(instance, username, password, tag) {
  log.debug("Inside ServiceNow Get Tag ID Plugin");

  var agent = null;
  if (process.env.HTTP_PROXY) {
    log.debug("Using Proxy", process.env.HTTP_PROXY);
    agent = new HttpsProxyAgent(process.env.HTTP_PROXY);
  }

  var method = "GET";
  var url =
    "https://" +
    instance +
    ".service-now.com/api/now/v2/table/label?sysparm_limit=10";
  if (tag) {
    url = url + "&sysparm_query=name%3D" + tag;
  } else {
    log.err("No Label Name provided");
    process.exit(1);
  }

  log.debug("URL: ", url);

  let id = fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization:
        "Basic " + new Buffer(username + ":" + password).toString("base64"),
    },
    agent: agent,
    body: null,
  })
    .then((res) => res.json())
    .then((body) => {
      log.debug("Response Received:", JSON.stringify(body));
      var labelId = body.result.reduce(function (accumulator, label) {
        return label.sys_id;
      }, "");
      log.sys("Label Found:", JSON.stringify(labelId));
      log.good("Response successfully received!");
      return labelId;
    })
    .catch((err) => {
      log.err(err);
      process.exit(1);
    });

  log.debug("Finished ServiceNow Get Tag ID Plugin");
  return id;
}

export async function getIncidents() {
  log.debug("Inside ServiceNow Plugin");

  //Destructure and get properties ready.
  const { instance, username, password, state, tag } = params;

  var agent = null;
  if (process.env.HTTP_PROXY) {
    log.debug("Using Proxy", process.env.HTTP_PROXY);
    agent = new HttpsProxyAgent(process.env.HTTP_PROXY);
  }

  var method = "GET";
  if (instance) {
    log.debug("instance:", instance);
    var url =
      "https://" +
      instance +
      ".service-now.com/api/now/v2/table/incident?sysparm_limit=10";
  } else {
    log.err("instance ID has not been provided or set correctly.");
    process.exit(1);
  }
  if (tag) {
    let tagId = await getTagID(instance, username, password, tag);
    url = url + "&sysparm_query=sys_tags." + tagId + "%3D" + tagId;
  }
  if (state) {
    var append;
    switch (state) {
      case "New":
        append = "&state=1";
        break;
      case "In Progress":
        append = "&state=2";
        break;
      case "On Hold":
        append = "&state=3";
        break;
      case "Resolved":
        append = "&state=4";
        break;
      case "Closed":
        append = "&state=5";
        break;
      case "Canceled":
        append = "&state=6";
        break;
      default:
        append = "";
    }
    url = url + append;
  }
  log.debug("URL: ", url);

  fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization:
        "Basic " + new Buffer(username + ":" + password).toString("base64"),
    },
    agent: agent,
    body: null,
  })
    .then((res) => res.json())
    .then(async (body) => {
      log.debug("Response Received:", JSON.stringify(body));
      var incidents = body.result.reduce(function (accumulator, incident) {
        return accumulator.concat({
          number: incident.number,
          sys_id: incident.sys_id,
        });
      }, []);
      log.sys("Incidents Found:", JSON.stringify(incidents));
      await result("incidents", JSON.stringify(incidents));
      log.good("Response successfully received!");
    })
    .catch((err) => {
      log.err(err);
      process.exit(1);
    });
  log.debug("Finished ServiceNow Plugin");
}
export async function updateIncidents() {
  log.debug("Inside ServiceNow Update Incident State Plugin");

  //Destructure and get properties ready.
  const { instance, username, password, state, incidents } = params;

  var agent = null;
  if (process.env.HTTP_PROXY) {
    log.debug("Using Proxy", process.env.HTTP_PROXY);
    agent = new HttpsProxyAgent(process.env.HTTP_PROXY);
  }

  var method = "PATCH";
  var body;
  const stateOpts = {
    New: 1,
    "In Progress": 2,
    "On Hold": 3,
    Resolved: 4,
    Closed: 5,
    Canceled: 6,
  };
  if (state && stateOpts[state]) {
    body = { state: stateOpts[state] + "" };
    log.debug("Body: ", body);
  } else {
    log.err("None or incorrect state specified");
    process.exit(1);
  }

  //TODO: also handle a newline entered list of manual sys_id's not just the array element returned by getIncidents
  JSON.parse(incidents).forEach((incident) => {
    let incidentSysId = incident.sys_id;
    log.debug("instance: ", instance);
    var url =
      "https://" +
      instance +
      ".service-now.com/api/now/v2/table/incident/" +
      incidentSysId;
    log.debug("Updating incident:", incidentSysId);
    fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization:
          "Basic " + new Buffer(username + ":" + password).toString("base64"),
      },
      agent: agent,
      body: JSON.stringify(body),
    }).catch((err) => {
      log.err(err);
      process.exit(1);
    });
    log.debug("Finished ServiceNow Update Incident State Plugin");
  });
}
