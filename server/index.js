#!/usr/bin/env node
const DB = require("./db-utils.js");
const Monitoring = require("./monitoring.js");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const options = require("./args.js")();
console.log(options);

const app = express();
var clients = [];
var monitoring = {};

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("client/dist"));

app.get("/monitoring", clientsHandler);

app.listen(options.port, () =>
  console.log(`Server listenning on port ${options.port}...`)
);

DB("./data/test.db").then(db => main(db));

/**
 * Main function
 * @param {sqlite3.Database} db Connection to the database
 */
function main(db) {
  monitoring = new Monitoring(options, db);
  monitoring.on("log_in_db", values => {
    console.log("Event from monitoring");
    clients.forEach(c => {
      c.res.write(`event: data\ndata:${JSON.stringify([values])}\n\n`);
    });
  });

  monitoring.start();
}

/**
 * Handle clients list to which monitoring events must be sent
 * @param {request} req HTTP request
 * @param {response} res HTTP response
 * @param {next} next Express Middleware
 */
async function clientsHandler(req, res, next) {
  // SSE headers
  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache"
  };
  res.writeHead(200, headers);

  // Attribute a unique id for this client
  let client = { id: Date.now(), res, options: getDefaultClientOptions() };
  clients.push(client);
  console.log(`${client.id}: connection started.`);

  // Send host and client information
  monitoring.getHostInfos().then(hostInfos => {
    let infos = {
      hostInfos: hostInfos,
      clientID: client.id,
      options: client.options
    };
    client.res.write(`event: hostinfos\ndata:${JSON.stringify(infos)}\n\n`);
  });

  // Send previous data
  monitoring
    .getLastValues(Date.now(), 60)
    .then(values =>
      client.res.write(`event: data\ndata:${JSON.stringify(values)}\n\n`)
    );

  // Remove client from clients list on close
  req.on("close", () => {
    console.log(`${client.id}: connection closed.`);
    clients = clients.filter(c => c.id !== client.id);
  });
}

/**
 * Return default monitoring options object for the client.
 */
function getDefaultClientOptions() {
  let clientOptions = {};

  clientOptions.freq = {
    // Monitoring frequency in ms
    name: "frequency",
    max: options.history * 30 * 24 * 3600 * 1000,
    min: options.freq,
    value: options.freq,
    unit: "ms",
    text: "Monitoring frequency"
  };
  clientOptions.hist = {
    // Max window size in seconds
    name: "history",
    max: options.history * 30 * 24 * 3600,
    min: 1,
    value: 60,
    unit: "s",
    text: "History size"
  };

  return clientOptions;
}
