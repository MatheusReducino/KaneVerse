const jwt = require("jsonwebtoken");
const db = require("../db");

async function verificarToken(req, res, next){
    const cabecalho = req.headers.authorization;
    if (!cabecalho || !cabecalho.startsWith("Bearer ")){
        return res.status(401).json({ msg: "Envie o token no formato Bearer TOKEN" })
    }
    let dados;
    try{
        dados = jwt.verify(cabecalho.substring(7), process.env.JWT_SECRET);
    } catch (error){
        return res.status(401).json({ msg: "Token invalido ou expirado" })
    }
    if (!dados.id || !Number.isInteger(dados.id) || dados.id <= 0){
        return res.status(401).json({ msg: "Token invalido" })
    }
    try{
        const r = await db.query("SELECT id, nome_usuario, email, cargo, banido FROM usuarios WHERE id=$1", [dados.id]);
        if (!r.rowCount){
            return res.status(401).json({ msg: "Usuario nao existe mais" })
        }
        if (r.rows[0].banido){
            return res.status(403).json({ msg: "Conta banida" })
        }
        req.usuario = r.rows[0];
        next();
    } catch (error){
        return res.status(500).json({ msg: "Erro ao consultar o usuario no banco" })
    }
}

function verificarAdmin(req, res, next){
    if (!req.usuario || req.usuario.cargo !== "admin"){
        return res.status(403).json({ msg: "Apenas administradores" })
    }
    next();
}

function podeAlterar(usuario, dono_id){
    return usuario.cargo === "admin" || Number(usuario.id) === Number(dono_id);
}

module.exports = { verificarToken, verificarAdmin, podeAlterar };
