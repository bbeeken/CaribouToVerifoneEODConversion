const chokidar = require("chokidar");
const path = require("path");

const RTP_FOLDER = path.join(__dirname, "RTP");
console.log(`Watching for files in: ${RTP_FOLDER}`);

const watcher = chokidar.watch(RTP_FOLDER, {
  ignored: /^\./, // ignore dotfiles
  persistent: true,
  usePolling: true, // If you're on a network or non-standard filesystem
  interval: 100, // Poll every 100ms
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 100,
  },
});

watcher
  .on("add", (filePath) => console.log(`File ${filePath} has been added`))
  .on("change", (filePath) => console.log(`File ${filePath} has been changed`))
  .on("unlink", (filePath) => console.log(`File ${filePath} has been removed`))
  .on("error", (error) => console.log(`Watcher error: ${error}`))
  .on("ready", () =>
    console.log(`Initial scan complete. Ready for changes in ${RTP_FOLDER}`)
  );
