const filesHelper = require("./files");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const upload = multer({});
const cors = require("cors");
const printManager = require("pdf-to-printer");
const os = require('os');
const ThermalPrinter = require("node-thermal-printer").printer;
const Types = require("node-thermal-printer").types;
const driver = require('printer')

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

    /* Ping */
    _app.get("/api/ping", async (req, res) => {
        return res.send({ success: true });
    });

    /* Printers */
    _app.get("/api/printers", upload.any(), async (req, res) => {
        let printers = [];
        try {
            printers = window.webContents.getPrinters();
        } catch (e) {
            return res.status(500).send({ success: false, message: e });
        }
        return res.send(printers);
    });

    _app.get("/api/printers/default", upload.any(), async (req, res) => {
        let printer;
        try {
            printer = getDefaultPrinter();
        } catch (e) {
            return res.status(500).send({ success: false, message: e });
        }
        return res.send(printer);
    });

    _app.get("/api/printers/:display_name", upload.any(), async (req, res) => {
        const { display_name } = req.params;
        let printer;
        try {
            printer = getPrinterByName(display_name);
        } catch (e) {
            return res.status(500).send({ success: false, message: e });
        }
        if (!printer) return res.status(404).send({ success: false, message: "Impresora no instalada" });
        return res.send(printer);
    });

    /* Jobs */
    _app.post("/api/jobs", upload.any(), async (req, res) => {
        const requestBuffer = req.files[0].buffer;
        const pdf = filesHelper.savePdf(requestBuffer);
        const { printerName, silent } = req.query;
        const win32 = ['-print-settings "fit" -exit-when-done']
        if (silent !== "true") {
            win32.push('-print-dialog');
        }
        const options = {
            printer: printerName || getDefaultPrinter().name,
            win32
        };

        printManager
            .print(pdf, options)
            .then((r) => res.send({ success: true, message: r }))
            .catch((e) => { res.send({ success: false, message: e }) })
            .finally(() => filesHelper.removePdf(pdf));
    });

    /* HostInfo */
    _app.get("/api/host/", async (req, res) => {
        const info = {
            user: os.userInfo(),
            hostname: os.hostname(),
        }
        return res.send(info);
    });

    /* ESC/POS printers */
    _app.post("/api/pos", async (req, res) => {
        let printer = new ThermalPrinter({
            type: Types.EPSON,
            interface: 'printer:Two Pilots Demo Printer',
            driver: driver,
        });

        printer.println("MAXI CODE");
        printer.maxiCode("4126565");

        printer.newLine();
        printer.newLine();
        printer.println("CODE93");
        printer.printBarcode("4126565");

        printer.newLine();
        printer.newLine();
        printer.println("CODE128");
        printer.code128("4126565", {
            height: 50,
            text: 1
        });

        printer.newLine();
        printer.newLine();
        printer.println("PDF417");
        printer.pdf417("4126565");

        printer.newLine();
        printer.newLine();
        printer.cut();
        printer.println("QR");
        printer.printQR("4126565");
        printer.table(["One", "Two", "Three"]);
        printer.cut();
        printer.execute();
        return res.send({ success: true });
    });

    function getPrinterByName(name) {
        return window.webContents.getPrinters().find(p => p.displayName === name);
    }

    function getDefaultPrinter() {
        return window.webContents.getPrinters().find(p => p.isDefault);
    }
}

module.exports = api;

