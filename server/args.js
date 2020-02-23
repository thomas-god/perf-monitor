const fs = require("fs");

/**
 * Assemble options from default, config file and arguments.
 */
function getOptions() {
  let options = defaultOptions();

  let fileOptions = loadFileOptions();
  Object.entries(fileOptions).forEach(([key, val]) => {
    options[key] = val;
  });

  let argsOptions = parseArgs();
  Object.entries(argsOptions).forEach(([key, val]) => {
    options[key] = val;
  });

  return options;
}

/**
 * Return the default options object.
 */
function defaultOptions() {
  return {
    freq: 1000, // in ms
    debug: false,
    port: 3000,
    history: 30 // in days
  };
}

/**
 * Return options from the config file
 */
function loadFileOptions() {
  let options = JSON.parse(fs.readFileSync("config.json"));
  return options;
}

/**
 * Return options passed as command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  let options = {};

  // Process user's inputs
  while (args.length) {
    let [key, value] = args.splice(0, 2);
    switch (key) {
      case "-f": {
        let val = Number(value);
        if (!isNaN(val) && val > 0) {
          options["freq"] = Number(value);
        } else {
          throw `-f option must be a positive number (number of ms), invalid value provided (${value})`;
        }
        break;
      }
      case "--debug": {
        if (value in [0, 1]) {
          options["debug"] = Boolean(Number(value));
        } else {
          throw "-debug option must evaluate to a boolean, invalid value provided (${value})";
        }
        break;
      }
      case "-p": {
        let val = Number(value);
        if (Number.isInteger(val) && val > 0) {
          options["port"] = val;
        } else {
          throw `-p option must be a positive integer, invalid value provided (${value})`;
        }
        break;
      }
      case "--history": {
        let val = Number(value);
        if (val > 0) {
          options["history"] = val;
        } else {
          throw `--history option must be a positive integer (number of days), invalid value provided (${value})`;
        }
      }
    }
  }
  return options;
}

module.exports = getOptions;
