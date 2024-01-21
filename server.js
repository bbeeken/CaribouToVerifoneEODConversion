const express = require("express");
const fs = require("fs");
const path = require("path");
const xmlFlow = require("xml-flow");
const chokidar = require("chokidar");
const { transformCaribouToISM, initializeISMRoot } = require("./transformer");
const { logError, logInfo } = require("./logger");

const app = express();

const RTP_FOLDER = path.join(__dirname, "RTP");
const CONVERTED_FOLDER = path.join(__dirname, "Converted");
console.log(`Watching for files in: ${RTP_FOLDER}`);

// Ensure RTP and Converted folders exist
fs.mkdirSync(RTP_FOLDER, { recursive: true });
fs.mkdirSync(CONVERTED_FOLDER, { recursive: true });

const processFile = (filePath) => {
  logInfo(`Processing file: ${filePath}`);
  const fileName = path.basename(filePath);
  const convertedFilePath = path.join(
    CONVERTED_FOLDER,
    `Converted_${Date.now()}_${fileName}`
  );

  const caribouFileStream = fs.createReadStream(filePath);
  const xmlStream = xmlFlow(caribouFileStream);
  const ismRoot = initializeISMRoot();

  xmlStream.on("tag:Mainitem", (caribouItem) => {
    try {
      const ismDetail = transformCaribouToISM(caribouItem);
      ismRoot
        .ele("NAXML-MovementReport")
        .ele("ItemSalesMovement")
        .push(ismDetail);
    } catch (error) {
      logError("Error transforming Caribou item to ISM detail:", error);
    }
  });

  xmlStream.on("end", () => {
    try {
      const ismXmlString = ismRoot.end({ pretty: true });

      // Save the output in Converted folder
      fs.writeFileSync(convertedFilePath, ismXmlString);
      logInfo(
        `ISM XML file generated successfully. Saved to ${convertedFilePath}`
      );
    } catch (error) {
      const message = "Error building final ISM XML:";
      logError(message, error);
    }
  });

  xmlStream.on("error", (error) => {
    const message = "Error processing XML:";
    logError(message, error);
  });
};

// File watcher
const watcher = chokidar.watch(RTP_FOLDER, {
  ignored: /^\./,
  persistent: true,
  ignoreInitial: false,
  usePolling: true,
  interval: 100,
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 100,
  },
});

watcher
  .on("add", (filePath) => {
    logInfo(`File ${filePath} has been added.`);
    processFile(filePath);
  })
  .on("error", (error) => logError(`Watcher error: ${error}`));

const PORT = 3000;
app.listen(PORT, () => {
  logInfo(
    `Server running on port ${PORT}. Monitoring ${RTP_FOLDER} for new files.`
  );
});
