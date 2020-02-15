const sqlite3 = require("sqlite3").verbose();
const os = require("os");

/**
 * Open a connection to an in memory sqlite3 database and return the DB object.
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
      console.log("Connection open to an in-memory database");
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

/**
 * Create the table to hold system memory.
 * @param {sqlite3.Database} db Connection object to the database.
 */
function createMemTable(db) {
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS memory (
          time_id INTEGER, 
          free INTEGER, 
          total INTEGER, 
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

/**
 * Snippet to get all tables in the database.
 * @param {sqlite3.Database} db Connection object to the database.
 */
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
 * Initiate the database with tables (time, cpus, memory).
 * @param {sqlite3.Database} db Connection object to the database.
 */
async function initDB(db) {
  await createTimeTable(db);
  await createCPUTable(db, os.cpus());
  await createMemTable(db);
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
 * Insert the timestamp of current timestep into the database and retuns its id
 * @param {sqlite3.Database} db Connection instance to a database
 * @param {Date} t Date object of the current timestep
 * @returns {Number} ID of the inserted row.
 */
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

module.exports = {
  openDB: openDB,
  closeDB: closeDB,
  initDB: initDB,
  createTimeTable: createTimeTable,
  createCPUTable: createCPUTable,
  createMemTable: createMemTable,
  getTables: getTables,
  insertDBTime: insertDBTime
};
