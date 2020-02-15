#!/usr/bin/env node
const os = require("os");
const sqlite3 = require("sqlite3").verbose();

/**
 * Open a conncetion to an in memory sqlite3 database and return the DB object.
 *
 * @returns {sqlite3.Database object} Opened connection to database.
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database("./data/test.db", err => {
      if (err) {
        console.error(err);
        reject(err);
      }
      console.log("Connection open to an in-memory databse");
      resolve(db);
    });
  });
}

/**
 * Create the time table in the database.
 * @param {sqlite3.Database} db Connection instance to the database.
 */
function createTimeTable(db) {
  return new Promise((resolve, reject) => {
    db.run(
      "CREATE TABLE IF NOT EXISTS time (time_id INTEGER PRIMARY KEY NOT NULL, timestamp INTEGER);",
      err => {
        if (err) {
          reject(err);
        }
        resolve();
      }
    );
  });
}

/**
 * Create the CPU table in the database based on the number of threads from os.cpus()
 * @param {sqlite3.Database} db Instance of the connection to the database
 * @param {os.cpus} cpus Object from os.cpus()
 */
function createCPUTable(db, cpus) {
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS cpus (
        time_id INTEGER,
        load REAL,
        FOREIGN KEY(time_id) REFERENCES time(time_id)
      );`,
      err => {
        if (err) {
          reject(err);
        }
        resolve();
      }
    );
  });
}

function getTables(db) {
  return new Promise((resolve, reject) => {
    let tables = [];
    db.each(
      `SELECT name FROM sqlite_master WHERE type='table' AND name not like 'sqlite_%';`,
      (err, row) => {
        if (err) {
          reject(err);
        }
        tables.push(row.name);
      },
      () => resolve(tables)
    );
  });
}

/**
 *
 * @param {sqlite3.Database} db Connection object to the database.
 */
async function initDB(db) {
  await createTimeTable(db);
  await createCPUTable(db, os.cpus());
  console.log(await getTables(db));
}

/**
 * Close the connection to a sqlite3 database.
 * @param {sqlite3.Database instance} db Instance of the sqlite3 database to close the connection to.
 */
function closeDB(db) {
  return new Promise((resolve, reject) => {
    db.close(err => {
      if (err) {
        console.error(err);
        reject(err);
      }
      console.log("Connection to database closed.");
      resolve();
    });
  });
}

/**
 * Convert os.cpus data into load values
 * @param {os.cpus return object} cpus_p CPUs object from the previous timestep
 * @param {os.cpus return object} cpus CPUs object from the current time step
 */
function cpuLoad(cpus_p, cpus, db, time_id) {
  return new Promise((resolve, reject) => {
    let load = [];
    for (let i = 0, len = cpus.length; i < len; i++) {
      let cpu = cpus[i].times,
        cpup = cpus_p[i].times;
      let total =
        cpu.user - cpup.user + cpu.sys - cpup.sys + cpu.idle - cpup.idle;
      load.push(total > 0 ? ((cpu.user - cpup.user) / total) * 100 : 0);
    }
    let full_load = load.reduce((a, b) => a + b) / load.length;

    // Insert into db
    db.run(
      `INSERT INTO cpus(time_id, load) VALUES(?, ?)`,
      [time_id, full_load],
      function(err) {
        if (err) {
          reject(err);
        }
      }
    );
    resolve(full_load);
  });
}

/**
 * Convert memory data into readable form
 * @param {Date object} t Current time in ms since epoch
 * @param {Object} mem Object with total and free memory
 */
function memoryUsage(mem, db, time_id) {
  return new Promise((resolve, reject) => {
    resolve({ mem: mem.free / 1024 / 1024 / 1024 });
  });
}

async function insertDBTime(db, t) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO time(timestamp) VALUES(?)`, [t.getTime()], function(
      err
    ) {
      if (err) {
        reject(err);
      }
      resolve(this.lastID);
    });
  });
}

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
  const db = await openDB();
  await initDB(db);
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
    let time_id = await insertDBTime(db, t);
    cpuLoad(cpup, cpu, db, time_id);
    memoryUsage(mem, db, time_id);

    // Update previous values
    cpup = JSON.parse(JSON.stringify(cpu));

    // Sleep until next timestp
    await sleep(options.freq);
    i += 1;
  }
  closeDB(db);
})();
