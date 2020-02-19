#!/usr/bin/env node
const DB = require("./db-utils.js");
const Monitoring = require("./monitoring.js");
const options = require("./args")();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

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
  monitoring = new Monitoring(db);
  monitoring.on("log_in_db", values => {
    console.log("Event from monitoring");
    clients.forEach(c => {
      c.res.write(`event: data\ndata:${JSON.stringify(values)}\n\n`);
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

  // Host information
  monitoring.getHostInfos().then(x => {
    client.res.write(`event: hostinfos\ndata:${JSON.stringify(x)}\n\n`);
  });

  // Unique id for this client
  let client = { id: Date.now(), res };
  clients.push(client);
  console.log(`${client.id}: connection started.`);

  // Remove client from clients list on close
  req.on("close", () => {
    console.log(`${client.id}: connection closed.`);
    clients = clients.filter(c => c.id !== client.id);
  });
}
