const os = require("os");
const parseArgs = require("./args.js");
const EventEmitter = require("events");
const si = require("systeminformation");

class Monitoring extends EventEmitter {
  /**
   *
   */
  constructor(options) {
    super();
    this.db;
    this.options = options;
    this.run = false;

    // Attach debug stop
    if (this.options.debug) {
      let debug_count = 0;
      this.on("log_in_db", () => {
        debug_count += 1;
        if (debug_count > 10) {
          this.stop();
        }
      });
    }
  }

  /**
   * Update the database used by the monitoring object
   * @param {Database} db New database to use
   */
  setDB(db) {
    this.db = db;
  }

  async start() {
    // Initialization
    this.run = true;
    await sleep(this.options.freq);

    // Infinite loop
    while (this.run) {
      // Get measures
      let t = new Date();

      // Launch async monitoring
      let time_id = await this.db.insertDBTime(t);
      let load = cpuLoad(this.db, time_id);
      let mem = memoryUsage(this.db, time_id);

      // Emit event
      let res = {};
      let obj = this;
      Promise.all([load, mem]).then(function(values) {
        values.forEach(value => {
          for (let [key, val] of Object.entries(value)) {
            res[key] = Math.round(val * 100) / 100;
          }
        });
        res.time = t;
        obj.emit("log_in_db", res);
      });

      // Sleep until next timestp
      await sleep(this.options.freq);
    }
  }

  /**
   * Stop the monitoring process
   */
  stop() {
    this.run = false;
  }

  /**
   * Returns host information (hostname, distro, release)
   */
  getHostInfos() {
    return si.osInfo().then(infos => {
      return {
        hostname: infos.hostname,
        distro: infos.distro,
        release: infos.release
      };
    });
  }

  /**
   * Get n timesteps, ending a t
   * @param {Number} t End time of the data
   * @param {Integer} n Number of timestep to get, backward from t
   */
  getLastValues(t, n) {
    let values = [];
    return new Promise((resolve, reject) => {
      this.db.each(
        `
      SELECT 
        cpus.load,
        memory.free,
        memory.total,
        time.timestamp
      FROM 
        time
      INNER JOIN cpus
        ON time.time_id = cpus.time_id
      INNER JOIN memory
        ON time.time_id = memory.time_id
      WHERE 
        (time.timestamp >= (?));`,
        [t - n * this.options.freq],
        (err, row) => {
          if (err) {
            reject(err);
          }
          values.push({
            time: row.timestamp,
            cpu_load: row.load,
            free: row.free,
            tot: row.total
          });
        },
        (err, nbrows) => {
          if (err) {
            reject(err);
          }
          resolve(values);
        }
      );
    });
  }
}

/**
 * Get current CPU load value and write it to the database
 * @param {sqlite3.Database} db Connection to a database
 * @param {Number} timde_id Time_id of the row to insert into
 */
function cpuLoad(db, time_id) {
  return si.currentLoad().then(load => {
    return new Promise((resolve, reject) => {
      let full_load = load.currentload;

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
      resolve({ cpu_load: full_load });
    });
  });
}

/**
 * Get current memory usage and write it to the database
 * @param {sqlite3.Database} db Connection to a database
 * @param {Number} timde_id Time_id of the row to insert into
 */
function memoryUsage(db, time_id) {
  return si.mem().then(mem => {
    return new Promise((resolve, reject) => {
      let free = mem.free / 1024 / 1024 / 1024;
      let tot = mem.total / 1024 / 1024 / 1024;
      // Insert into DB
      db.run(
        `INSERT INTO memory(time_id, total, free) VALUES(?, ?, ?)`,
        [time_id, tot, free],
        function(err) {
          if (err) {
            reject(err);
          }
        }
      );
      resolve({ free: free, tot: tot });
    });
  });
}

/**
 * Sleep function to be used as await sleep(timeout)
 * @param {number} timeout Timeout number is ms
 * @returns {Promise} Promise that will resolve after timeout ms
 */
function sleep(timeout) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, timeout);
  });
}

module.exports = Monitoring;
