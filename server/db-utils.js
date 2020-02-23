const sqlite3 = require("sqlite3").verbose();
const os = require("os");

exports = module.exports = createConnection;

async function createConnection(options, path) {
  var db = await openDB(path);
  await db.initDB(options);

  return db;
}

/**
 * Open a connection to an in memory sqlite3 database and return the DB object.
 * @param {String} path Path to the database file.
 * @returns {sqlite3.Database object} Opened connection to database.
 */
function openDB(path) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(path, err => {
      if (err) {
        console.error(err);
        reject(err);
      }

      // Add custom methods to the database instance
      db.createOptionsTable = createOptionsTable;
      db.createTimeTable = createTimeTable;
      db.createCPUTable = createCPUTable;
      db.createMemTable = createMemTable;
      db.getTables = getTables;
      db.initDB = initDB;
      db.insertDBTime = insertDBTime;
      db.getTimeWindowIDs = getTimeWindowIDs;
      db.closeDB = closeDB;

      resolve(db);
    });
  });
}

/**
 * Create the time table in the database.
 * @param {Number} history History size in days.
 */
function createTimeTable() {
  return new Promise((resolve, reject) => {
    this.run(
      `CREATE TABLE IF NOT EXISTS time (
        time_id INTEGER PRIMARY KEY NOT NULL, 
        timestamp INTEGER
      );
      `,
      err => {
        if (err) {
          reject(err);
        }
        console.log("table time created...");
        this.run(
          `
          CREATE TRIGGER IF NOT EXISTS trim_time_table AFTER INSERT ON time BEGIN
            DELETE FROM time WHERE timestamp < (new.timestamp - (
              SELECT value FROM options WHERE name = "history"
            ));
          END;`
        );
        resolve();
      }
    );
  });
}

/**
 * Create the CPU table in the database based on the number of threads from os.cpus()
 * @param {os.cpus} cpus Object from os.cpus()
 */
function createCPUTable(cpus) {
  return new Promise((resolve, reject) => {
    this.run(
      `CREATE TABLE IF NOT EXISTS cpus (
          time_id INTEGER,
          load REAL,
          FOREIGN KEY(time_id) REFERENCES time(time_id) ON UPDATE CASCADE ON DELETE CASCADE
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

/**
 * Create the table to hold system memory.
 */
function createMemTable() {
  return new Promise((resolve, reject) => {
    this.run(
      `CREATE TABLE IF NOT EXISTS memory (
          time_id INTEGER, 
          free INTEGER, 
          total INTEGER, 
          FOREIGN KEY(time_id) REFERENCES time(time_id) ON UPDATE CASCADE ON DELETE CASCADE
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

/**
 * Create a table to hold relevant db options
 * @param {Object} options App options
 */
function createOptionsTable(options) {
  return new Promise((resolve, reject) => {
    this.serialize(function() {
      this.run(`CREATE TABLE IF NOT EXISTS options (
        name TEXT UNIQUE,
        value REAL,
        unit TEXT
      );`);
      this.run(
        `INSERT OR REPLACE INTO options (name, value, unit) VALUES(
        "history", ?, "ms"
      );`,
        options.history * 24 * 3600 * 1000
      );
      resolve();
    });
  });
}

/**
 * Snippet to get all tables in the database.
 */
function getTables() {
  return new Promise((resolve, reject) => {
    let tables = [];
    this.each(
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
 * Initiate the database with tables (time, cpus, memory).
 */
async function initDB(options) {
  console.log(options);
  await this.createOptionsTable(options);
  await this.createTimeTable();
  await this.createCPUTable(os.cpus());
  await this.createMemTable();
  console.log(await this.getTables());
}

/**
 * Close the connection to a sqlite3 database.
 */
function closeDB() {
  return new Promise((resolve, reject) => {
    this.close(err => {
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
 * Insert the timestamp of current timestep into the database and retuns its id
 * @param {Date} t Date object of the current timestep
 * @returns {Number} ID of the inserted row.
 */
async function insertDBTime(t) {
  return new Promise((resolve, reject) => {
    this.run(`INSERT INTO time(timestamp) VALUES(?)`, [t.getTime()], function(
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
 * Return an array of time_id corresponding to timestamps in the specified time windows.
 * @param {Date} tstart First timestamp of the time window (included)
 * @param {Date} tend Last timestamp of the time window (included)
 */
function getTimeWindowIDs(tstart, tend) {
  return new Promise((resolve, reject) => {
    let time_ids = [];
    this.each(
      `
    SELECT time_id 
    FROM time 
    WHERE timestamp >= ? AND timestamp <= ?`,
      [tstart.getTime(), tend.getTime()],
      (err, row) => {
        if (err) {
          reject(err);
        }
        time_ids.push(row.time_id);
      },
      (err, nbRows) => {
        if (err) {
          reject(err);
        }
        resolve(time_ids);
      }
    );
  });
}

//module.exports = openDB;
