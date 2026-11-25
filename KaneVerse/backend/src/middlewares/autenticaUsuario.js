const jwt = require("jsonwebtoken");
const db = require("../db");
async function autenticaUsuario(req,res,next){
    const authorization = req.headers.authorization;
    if(!authorization || !authorization.startsWith("Bearer ")){
        return res.status(401).json({msg: "Token nao informado"})
    }
    const token = authorization.slice(7);
    let dados;
    try{
        dados = jwt.verify(token, process.env.JWT_SECRET, {algorithms: ["HS256"]})
        if(!Number.isInteger(dados.id) || dados.id <= 0 || dados.id > 2147483647){
            return res.status(401).json({msg: "Token invalido"})
        }
    } catch (error){
        return res.status(401).json({msg: "Token invalido ou expirado"})
    }
    try{
        const r = await db.query("SELECT id,nome_usuario,admin,banido FROM usuarios WHERE id=$1", [dados.id])
        if(!r.rowCount){
            return res.status(401).json({msg: "Usuario nao encontrado"})
        }
        if(r.rows[0].banido){
            return res.status(403).json({msg: "Usuario banido"})
        }
        req.usuario = r.rows[0];
        next()
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao autenticar usuario"})
    }
}
module.exports = autenticaUsuario;
