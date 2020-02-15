#!/usr/bin/env node
const os = require("os");
const dbUtils = require("./db-utils.js");
const processing = require("./processing.js");

/**
 * Sleep function to be used as await sleep(timeout)
 * @param {number} timeout Timeout number is ms
 *
 * @returns {Promise} Promise that will resolve after timeout ms
 */
function sleep(timeout) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, timeout);
  });
}

/**
 * Parse CLI arguments into a comprehensive object.
 */
function parseArgs() {
  const args = process.argv.slice(2);
  let options = {};

  // Process user's inputs
  while (args.length) {
    let [key, value] = args.splice(0, 2);
    if (key === "-freq") {
      let val = Number(value);
      if (!isNaN(val) && val > 0) {
        options["freq"] = Number(value);
      } else {
        console.error(
          "Invalid value provided for -freq, must be a positive number."
        );
      }
    }
  }

  // Populate with default values
  if (!("freq" in options)) {
    options["freq"] = 1000;
  }
  return options;
}

(async () => {
  // Load user's parameters
  const options = parseArgs();
  console.log(options);

  // Initialisation
  const db = await dbUtils.openDB();
  await dbUtils.initDB(db);
  let cpup = os.cpus();
  await sleep(options.freq);

  // Infinite loop
  let i = 0;
  while (i < 10) {
    // Get measures
    let t = new Date();
    let cpu = os.cpus();
    let mem = {
      free: os.freemem(),
      tot: os.totalmem()
    };

    // Launch async measures processing
    let time_id = await dbUtils.insertDBTime(db, t);
    processing.cpuLoad(cpup, cpu, db, time_id);
    processing.memoryUsage(mem, db, time_id);

    // Update previous values
    cpup = JSON.parse(JSON.stringify(cpu));

    // Sleep until next timestp
    await sleep(options.freq);
    i += 1;
  }
  dbUtils.closeDB(db);
})();
