var express = require("express");
var router = express.Router();

router.get("/", function(req, res) {
  clientsHandler(req, res);
});

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
    res,
    options: getDefaultClientOptions(req.app.locals.options)
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
    .getLastValues(Date.now(), 60)
    .then(values =>
      client.res.write(`event: data\ndata:${JSON.stringify(values)}\n\n`)
    );

  // Remove client from clients list on close
  req.on("close", () => {
    console.log(`${client.id}: connection closed.`);
    req.app.locals.clients = req.app.locals.clients.filter(
      c => c.id !== client.id
    );
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
    text: "Monitoring frequency"
  };
  clientOptions.hist = {
    // Max window size in seconds
    name: "history",
    max: options.history * 30 * 24 * 3600,
    min: 1,
    value: 60,
    unit: "s",
    text: "History size"
  };

  return clientOptions;
}

module.exports = router;
