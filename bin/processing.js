const os = require("os");
const dbUtils = require("./db-utils.js");
const parseArgs = require("./args.js");

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
    let free = mem.free / 1024 / 1024 / 1024;
    let tot = mem.tot / 1024 / 1024 / 1024;
    // Insert into DB
    db.run(
      `INSERT INTO memory(time_id, total, free) VALUES(?, ?, ?)`,
      [time_id, tot, free],
      function(err) {
        if (err) {
          console.error(err);
        }
      }
    );
    resolve({ free: free, tot: tot });
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

async function processing() {
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
  while (options.debug ? i < 10 : true) {
    // Get measures
    let t = new Date();
    let cpu = os.cpus();
    let mem = {
      free: os.freemem(),
      tot: os.totalmem()
    };

    // Launch async measures processing
    let time_id = await dbUtils.insertDBTime(db, t);
    cpuLoad(cpup, cpu, db, time_id);
    memoryUsage(mem, db, time_id);

    // Update previous values
    cpup = JSON.parse(JSON.stringify(cpu));

    // Sleep until next timestp
    await sleep(options.freq);
    i += 1;
  }
  dbUtils.closeDB(db);
}

module.exports = processing;
