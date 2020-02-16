#!/usr/bin/env node
const DB = require("./db-utils.js");
const Monitoring = require("./monitoring.js");

(async () => {
  const db = await DB("./data/test.db");
  const monitoring = new Monitoring(db);

  await monitoring.start();
})();
