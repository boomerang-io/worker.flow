const fetch = require("node-fetch");
const HttpsProxyAgent = require("https-proxy-agent");
const log = require("../log.js");
const utils = require("../utils.js");
const sn = require('servicenow-rest-api');

module.exports = {
  authenticate() {
    log.debug("Inside ServiceNow Authenticate Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { url, username, password } = taskProps;

    const ServiceNow = new sn(url, username, password);

    ServiceNow.Authenticate(res => {
      log.good(res);
    });
  },
  incidents() {
    this.authenticate();

    ServiceNow.getSampleData('incident', (res) => {    // 
      log.debug("Incident:", res);
    });
  },
  incidents2() {
    log.debug("Inside ServiceNow Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { instance, username, password } = taskProps;

    var agent = null;
    if (process.env.HTTP_PROXY) {
      log.debug("Using Proxy", process.env.HTTP_PROXY);
      agent = new HttpsProxyAgent(process.env.HTTP_PROXY)
    }

    var method = "GET";
    var url = "https://" + instance + ".service-now.com/api/now/v2/table/incident?sysparm_limit=10"

    fetch(
      url,
      {
        method,
        "headers": {
          'Accept': 'application/json',
          "Content-Type": 'application/json',
          'Authorization': 'Basic ' + new Buffer(username + ":" + password).toString("base64"),
        },
        "agent": agent,
        "body": null
      }
    ).then(res => res.json())
      .then(body => {
        log.debug("Response Received:", JSON.stringify(body));
        var incidents = body.result.reduce(
          function (accumulator, incident) {
            return accumulator.concat(incident.number);
          },
          []
        );
        // var incidents = "";
        // body.result.forEach(incident => { incidents = incidents + incident.number });
        log.sys("Incidents Found:", JSON.stringify(incidents));
        utils.setOutputProperty("incidents", JSON.stringify(incidents));
        log.good("Response successfully received!")
      })
      .catch(err => {
        log.err(err);
        process.exit(1);
      });
    log.debug("Finished ServiceNow Plugin");
  },
  getincidents() {
    log.debug("Inside ServiceNow Plugin");

    //Destructure and get properties ready.
    const taskProps = utils.substituteTaskInputPropsValuesForWorkflowInputProps();
    const { instance, username, password, state, tag } = taskProps;

    var agent = null;
    if (process.env.HTTP_PROXY) {
      log.debug("Using Proxy", process.env.HTTP_PROXY);
      agent = new HttpsProxyAgent(process.env.HTTP_PROXY)
    }

    var method = "GET";
    var url = "https://" + instance + ".service-now.com/api/now/v2/table/incident?sysparm_limit=10"
    if (tag) {
      url = url + "&sysparm_query=sys_tags." + tag + "%3D" + tag;
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

    fetch(
      url,
      {
        method,
        "headers": {
          'Accept': 'application/json',
          "Content-Type": 'application/json',
          'Authorization': 'Basic ' + new Buffer(username + ":" + password).toString("base64"),
        },
        "agent": agent,
        "body": null
      }
    ).then(res => res.json())
      .then(body => {
        log.debug("Response Received:", JSON.stringify(body));
        var incidents = body.result.reduce(
          function (accumulator, incident) {
            return accumulator.concat({ "number": incident.number, "sys_id": incident.sys_id });
          },
          []
        );
        log.sys("Incidents Found:", JSON.stringify(incidents));
        utils.setOutputProperty("incidents", JSON.stringify(incidents));
        log.good("Response successfully received!")
      })
      .catch(err => {
        log.err(err);
        process.exit(1);
      });
    log.debug("Finished ServiceNow Plugin");
  }
};
