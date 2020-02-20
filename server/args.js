/**
 * Parse CLI arguments into a comprehensive object.
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
        let val = Number(val);
        if (Number.isInteger(val) && val > 0) {
          options["history"] = val;
        } else {
          throw `--history option must be a positive integer (number of days), invalid value provided (${value})`;
        }
      }
    }
  }

  // Populate with default values
  if (!("freq" in options)) {
    options["freq"] = 1000;
  }
  if (!("debug" in options)) {
    options["debug"] = false;
  }
  if (!("port" in options)) {
    options["port"] = 3000;
  }
  if (!("history" in options)) {
    options["history"] = 30;
  }
  return options;
}

module.exports = parseArgs;
