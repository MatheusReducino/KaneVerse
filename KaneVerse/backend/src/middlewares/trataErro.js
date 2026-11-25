const multer = require("multer");
function trataErro(error,req,res,next){
    if(res.headersSent){
        return next(error)
    }
    if(error instanceof multer.MulterError){
        if(error.code === "LIMIT_FILE_SIZE"){
            return res.status(413).json({msg: "Imagem deve ter no maximo 2 MB"})
        }
        return res.status(400).json({msg: "Erro no envio do arquivo"})
    }
    if(error.type === "entity.parse.failed"){
        return res.status(400).json({msg: "JSON invalido"})
    }
    if(error.type === "entity.too.large"){
        return res.status(413).json({msg: "Requisicao muito grande"})
    }
    console.error(error)
    return res.status(500).json({msg: "Erro interno"})
}
module.exports = trataErro;
