const multer = require("multer");
const upload = multer({storage: multer.memoryStorage(), limits: {fileSize: 2*1024*1024, files: 1}});
function tipoImagem(buffer){
    if(!Buffer.isBuffer(buffer)){
        return null;
    }
    if(buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a"){
        return "image/png";
    }
    if(buffer.subarray(0, 3).toString("hex") === "ffd8ff"){
        return "image/jpeg";
    }
    return null;
}
function verificaImagem(req,res,next){
    if(!req.file){
        return res.status(400).json({msg: "Nenhuma imagem enviada"})
    }
    const tipo = tipoImagem(req.file.buffer);
    if(!tipo || req.file.mimetype !== tipo){
        return res.status(400).json({msg: "Envie uma imagem PNG ou JPEG"})
    }
    next()
}
function enviaImagem(res,buffer){
    const tipo = tipoImagem(buffer);
    if(!tipo){
        return res.status(404).json({msg: "Imagem nao encontrada"})
    }
    res.setHeader("Content-Type", tipo);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
    return res.send(buffer)
}
module.exports = {upload, verificaImagem, enviaImagem};
