// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')
const path = require('path')
const { webContents } = require('electron')
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const upload = multer({});
const cors = require("cors");
const fs = require("fs");
const printer = require("pdf-to-printer");

// Config
const Config = {
  http_port: "8081",
  socket_port: "3030",
};
// Http server
const _app = express();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const server = require("http").Server(_app);
server.listen(Config.http_port);

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  const window = BrowserWindow.getFocusedWindow();
  const printers = window.webContents.getPrinters();
  console.log(printers);
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
/**
 * EXPRESS
 */
_app.use(
    bodyParser.urlencoded({
      extended: false,
    })
);

_app.use("/assets", express.static(__dirname + "/www/assets"));
_app.use(cors({ origin: true, credentials: true }));
_app.get("/test", function (req, res) {
  res.send({ text: "hol" });
});
function save(buffer) {
  const pdfPath = path.join(__dirname, randomString() + ".pdf");
  console.log(buffer);
  fs.writeFileSync(pdfPath, buffer, "binary");
  return pdfPath;
}

function remove(pdf) {
  fs.unlinkSync(pdf);
}

function randomString() {
  return Math.random().toString(36).substring(7);
}
_app.post("/print", upload.any(), (req, res) => {
  console.log(req.query.printerName);
  const pdf = save(req.files[0].buffer);
  const options = {
    printer: req.query.printerName || 'Microsoft Print To PDF',
    win32: ['-print-settings "fit"', '-silent'],
  };

  printer.print(pdf, options).then(() => res.send({ success: true })).catch((e) => { console.log(e); res.send({ e }) });
  // .finally(() => remove(pdf));
  // const options = {
  //   silent: true,
  //   deviceName: "Microsoft Print to PDF",
  //   pageRanges: [
  //     {
  //       from: 0,
  //       to: 1,
  //     },
  //   ],
  // };
  // win.webContents.print(options, (success, errorType) => {
  //   if (!success) console.log(errorType);
  // });
});
