#!/usr/bin/env node
const DB = require("./db-utils.js");
const Monitoring = require("./monitoring.js");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sse = require("./routes/sse.js");

var options = require("./args.js")();
console.log(options);

// Attach express middleware and routes
const app = express();
var clients = [];
app.locals.options = options;
app.locals.clients = clients;
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("client/dist"));
app.use("/monitoring", sse);

// Initiate monitoring instance
var monitoring = new Monitoring(options);
monitoring.on("log_in_db", values => {
  console.log("Event from monitoring");
  clients.forEach(c => {
    c.res.write(`event: data\ndata:${JSON.stringify([values])}\n\n`);
  });
});
app.locals.monitoring = monitoring;

// Connect to db and start listenning and monitoring
DB("./data/test.db").then(db => {
  monitoring.setDB(db);
  app.listen(options.port, () =>
    console.log(`Server listenning on port ${options.port}...`)
  );
  monitoring.start();
});
