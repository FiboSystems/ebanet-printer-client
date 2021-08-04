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
const driver = require('printer');
const { count } = require("console");

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
    _app.use(bodyParser.json());
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
    _app.post("/api/pos/:printer_name", async (req, res) => {
        const { printer_name } = req.params;
        const { schema, settings } = req.body;
        let printerName;
        try {
            printerName = getPrinterByName(printer_name);
        } catch (e) {
            return res.status(404).send({ success: false, message: e });
        }
        if (!printerName) return res.status(404).send({ success: false, message: "Impresora no encontrada." });
        const schemaJobs = Array.isArray(req.body) ? req.body : [schema];
        let printer = new ThermalPrinter({
            type: Types.EPSON,
            interface: `printer:${printer_name}`,
            driver: driver,
        });

        try {
            for (const job of schemaJobs) {
                console.log(job);
                let isConnected = await printer.isPrinterConnected();
                if (!isConnected) return res.status(503).send({ success: false, message: "Impresora no conectada." });

                printer.setTextSize(settings.textWidth, settings.textHeight);

                for (const schemaItem of schema) {
                    for (const command in schemaItem.commands) {
                        const args = schemaItem.commands[`${command}`] === "content" ? schemaItem.content : schemaItem.commands[`${command}`];
                        if (command.includes('|')) {
                            const count = command.substring(0, command.lastIndexOf('|'));
                            const commandKey = command.substring(command.lastIndexOf('|') + 1, command.length);
                            let i = 0;
                            while (i <= parseInt(count)) {
                                printer[`${commandKey}`](args);
                                i++;
                            }
                        } else {
                            if (command === 'leftRight') {
                                printer[`${command}`](args.split(',')[0], args.split(',')[1]);
                            } else {
                                printer[`${command}`](args);
                            }
                        }
                    }
                }
                await printer.execute();
            }
            return res.send({ success: true });
        } catch (error) {
            return res.status(500).send({ success: false });
        }
    });

    function getPrinterByName(name) {
        return window.webContents.getPrinters().find(p => p.displayName === name);
    }

    function getDefaultPrinter() {
        return window.webContents.getPrinters().find(p => p.isDefault);
    }
}

module.exports = api;

