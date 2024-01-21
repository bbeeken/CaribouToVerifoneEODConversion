const util = require("util");

const logError = (message, error) => {
  console.error(
    `[${new Date().toISOString()}] ERROR: ${message}`,
    util.inspect(error, { depth: null })
  );
};

const logInfo = (message) => {
  console.info(`[${new Date().toISOString()}] INFO: ${message}`);
};

module.exports = { logError, logInfo };
