function verificarDono(req, res, next){
    const idUsuario = parseInt(req.usuario.id)
    const idDono = parseInt(req.params.usuario_id || req.params.id)

    if(idUsuario !== idDono && req.usuario.cargo !== "admin"){
        return res.status(403).json({msg: "Voce nao tem permissao para realizar esta acao"})
    }
    next()
}

module.exports = verificarDono
