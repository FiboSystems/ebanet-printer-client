const filesHelper = require("./files");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const upload = multer({});
const cors = require("cors");
const printer = require("pdf-to-printer");
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
        return res.send(window.webContents.getPrinters());
    });

    _app.get("/api/printers/default", upload.any(), async (req, res) => {
        return res.send(window.webContents.getPrinters().find(p => p.isDefault));
    });

    _app.get("/api/printers/:display_name", upload.any(), async (req, res) => {
        const { display_name } = req.params;
        const printer = window.webContents.getPrinters().find(p => p.displayName === display_name);
        if (!printer) return res.status(404).send("Impresora no instalada");
        return res.send(printer);
    });

    /* Jobs */
    _app.post("/api/jobs", upload.any(), async (req, res) => {
        return res.send(window.webContents.getPrinters());
    });
}

module.exports = api;

