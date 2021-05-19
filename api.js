const filesHelper = require("./files");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const upload = multer({});
const cors = require("cors");
const printManager = require("pdf-to-printer");
const { BrowserWindow } = require('electron')

const api = (window) => {
    // Config
    const EXPRESS_CONFIG = {
        http_port: "8081",
        socket_port: "3030",
    };

    const _app = express();
    const server = require("http").Server(_app);
    server.listen(EXPRESS_CONFIG.http_port);

    _app.use(
        bodyParser.urlencoded({
            extended: false,
        })
    );
    _app.use("/assets", express.static(__dirname + "/www/assets"));
    _app.use(cors({ origin: true, credentials: true }));

    /* Printers */
    _app.get("/api/printers", upload.any(), async (req, res) => {
        let printers = [];
        try {
            printers = window.webContents.getPrinters();
        } catch (e) {
            return res.status(500).send(e);
        }
        return res.send(printers);
    });

    _app.get("/api/printers/default", upload.any(), async (req, res) => {
        let printer;
        try {
            printer = getDefaultPrinter();
        } catch (e) {
            return res.status(500).send(e);
        }
        return res.send(printer);
    });

    _app.get("/api/printers/:display_name", upload.any(), async (req, res) => {
        const { display_name } = req.params;
        let printer;
        try {
            printer = getPrinterByName(display_name);
        } catch (e) {
            return res.status(500).send(e);
        }
        if (!printer) return res.status(404).send("Impresora no instalada");
        return res.send(printer);
    });

    /* Jobs */
    _app.post("/api/jobs", upload.any(), async (req, res) => {
        const requestBuffer = req.files[0].buffer;
        const pdf = filesHelper.savePdf(requestBuffer);
        const { printerName, silent } = req.query;
        const win32 = ['-print-settings "fit"']
        if (silent !== "true") {
            win32.push('-print-dialog');
        }
        const options = {
            printer: printerName || getDefaultPrinter().name,
            win32
        };

        printManager
            .print(pdf, options)
            .then(() => res.send({ success: true }))
            .catch((e) => { res.send({ e }) })
            .finally(() => filesHelper.removePdf(pdf));
    });

    function getPrinterByName(name) {
        return window.webContents.getPrinters().find(p => p.displayName === name);
    }

    function getDefaultPrinter() {
        return window.webContents.getPrinters().find(p => p.isDefault);
    }
}

module.exports = api;

