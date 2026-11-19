const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 3 * 1024 * 1024 }
})

function imagemValida(arquivo){
    if (!arquivo || !arquivo.buffer){
        return false;
    }
    const bytes = arquivo.buffer;
    if (arquivo.mimetype === "image/png"){
        return bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    }
    if (arquivo.mimetype === "image/jpeg"){
        return bytes.length > 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    }
    if (arquivo.mimetype === "image/webp"){
        return bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    }
    return false;
}

module.exports = { upload, imagemValida };
