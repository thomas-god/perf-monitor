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
      case "-freq":
        let val = Number(value);
        if (!isNaN(val) && val > 0) {
          options["freq"] = Number(value);
        } else {
          console.error(
            "Invalid value provided for -freq, must be a positive number."
          );
        }
        break;
      case "-debug":
        if (value in [0, 1]) {
          options["debug"] = Boolean(value);
        } else {
          console.error("-debug option must evaluate to a boolean.");
        }
        break;
    }
  }

  // Populate with default values
  if (!("freq" in options)) {
    options["freq"] = 1000;
  }
  if (!("debug" in options)) {
    options["debug"] = false;
  }
  return options;
}

module.exports = parseArgs;
