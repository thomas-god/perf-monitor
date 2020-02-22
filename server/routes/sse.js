var express = require("express");
var router = express.Router();

router.get("/", clientsHandler);

router.post("/options", updateOptions);

/**
 * Handle clients list to which monitoring events must be sent
 * @param {request} req HTTP request
 * @param {response} res HTTP response
 */
async function clientsHandler(req, res) {
  // SSE headers
  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache"
  };
  res.writeHead(200, headers);

  // Attribute a unique id for this client
  let client = {
    id: Date.now(),
    req: req,
    res: res,
    options: getDefaultClientOptions(req.app.locals.options),
    pause: false
  };
  req.app.locals.clients.push(client);
  console.log(`${client.id}: connection started.`);

  // Send host and client information
  req.app.locals.monitoring.getHostInfos().then(hostInfos => {
    let infos = {
      hostInfos: hostInfos,
      clientID: client.id,
      options: client.options
    };
    client.res.write(`event: hostinfos\ndata:${JSON.stringify(infos)}\n\n`);
  });

  // Send previous data
  req.app.locals.monitoring
    .getLastValues(Date.now(), getNbTimesteps(client))
    .then(values => {
      client.res.write(`event: data\ndata:${JSON.stringify(values)}\n\n`);
    });

  // Remove client from clients list on close
  client.req.on("close", event => {
    let client_idx = req.app.locals.clients.findIndex(c => c.id === client.id);
    if (client_idx > -1) {
      console.log(`${client.id}: connection closed.`);
      req.app.locals.clients.splice(client_idx, 1);
    }
  });
}

/**
 * Return default monitoring options object for the client.
 */
function getDefaultClientOptions(options) {
  let clientOptions = {};

  clientOptions.freq = {
    // Monitoring frequency in ms
    name: "frequency",
    max: options.history * 30 * 24 * 3600 * 1000,
    min: options.freq,
    value: options.freq,
    unit: "ms",
    text: "Monitoring frequency",
    edit: false
  };
  clientOptions.hist = {
    // Max window size in seconds
    name: "history",
    max: options.history * 30 * 24 * 3600,
    min: 1,
    value: 60,
    unit: "s",
    text: "History size",
    edit: true
  };

  return clientOptions;
}

function updateOptions(req, res) {
  let clientID = req.body.clientID;
  let client = req.app.locals.clients.find(c => c.id === clientID);
  if (client === undefined) {
    res.status(403).end();
    return;
  }

  client.pause = true;
  console.log(`${client.id}: updating options, SSE connection paused`);
  let newOptions = req.body.options;
  Object.entries(newOptions).forEach(([key, value]) => {
    client.options[key].value = value;
  });
  req.app.locals.monitoring
    .getLastValues(Date.now(), getNbTimesteps(client))
    .then(newData => {
      res.status(200).json({
        options: client.options,
        data: newData
      });
      console.log(`${client.id}: options updated, SSE connection unpaused`);
      client.pause = false;
    });
}

/**
 * Return the number of timesteps to retrieve depending on client's
 * history size and frequency options.
 * @param {client objet} client Current client
 */
function getNbTimesteps(client) {
  return Math.ceil(
    client.options.hist.value / (client.options.freq.value / 1000)
  );
}

module.exports = router;
