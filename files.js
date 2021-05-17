const fs = require("fs");
const path = require('path')

module.exports.savePdf = function (buffer) {
    const pdfPath = path.join(__dirname + "/temp_files", randomString() + ".pdf");
    fs.writeFileSync(pdfPath, buffer, "binary");
    return pdfPath;
}
module.exports.removePdf =  function (pdf) {
    fs.unlinkSync(pdf);
}

function randomString() {
    return Math.random().toString(36).substring(7);
}
