#!/usr/bin/env node
const DB = require("./db-utils.js");
const Monitoring = require("./monitoring.js");
const options = require("./args")();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
let clients = [];

async function eventsHandler(req, res, next) {
  // SSE headers
  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache"
  };
  res.writeHead(200, headers);

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

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.get("/monitoring", eventsHandler);

app.listen(options.port, () =>
  console.log(`Server listenning on port ${options.port}...`)
);

(async () => {
  const db = await DB("./data/test.db");
  const monitoring = new Monitoring(db);
  monitoring.on("log_in_db", time_id => {
    console.log("Event from monitoring");
    clients.forEach(c => {
      c.res.write(`data:${JSON.stringify({ time_id: time_id })}\n\n`);
    });
  });

  monitoring.start();
})();
