const jwt = require("jsonwebtoken")

function verificarToken(req, res, next){
    const authHeader = req.headers.authorization
    if(!authHeader){
        return res.status(401).json({msg: "Token nao informado"})
    }
    const partes = authHeader.split(" ")
    if(partes.length !== 2 || partes[0] !== "Bearer"){
        return res.status(401).json({msg: "Formato do token invalido"})
    }
    const token = partes[1]
    try{
        const dados = jwt.verify(token, process.env.JWT_SECRET)
        req.usuario = dados
        next()
    }
    catch(err){
        return res.status(401).json({msg: "Token invalido ou expirado"})
    }
}

function verificarAdmin(req, res, next){
    if(req.usuario.cargo !== "admin"){
        return res.status(403).json({msg: "Acesso permitido apenas para administradores"})
    }
    next()
}

module.exports = { verificarToken, verificarAdmin }
