function verificaAdmin(req,res,next){
    if(!req.usuario || req.usuario.admin !== true){
        return res.status(403).json({msg: "Apenas administradores podem realizar essa operacao"})
    }
    next()
}
module.exports = verificaAdmin;
