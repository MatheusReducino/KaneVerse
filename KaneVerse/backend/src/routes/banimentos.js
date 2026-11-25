const express = require("express");
const router = express.Router();
const db = require("../db");
const autenticaUsuario = require("../middlewares/autenticaUsuario");
const verificaId = require("../middlewares/verificaId");
const verificaAdmin = require("../middlewares/verificaAdmin");

router.get("/", autenticaUsuario, verificaAdmin, async (req,res)=>{
    try{
        const r = await db.query("SELECT b.*,u.nome_usuario AS usuario,a.nome_usuario AS administrador FROM banimentos b JOIN usuarios u ON b.usuario_id=u.id JOIN usuarios a ON b.administrador_id=a.id ORDER BY b.data_banimento DESC,b.id DESC")
        return res.status(200).json(r.rows)
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar banimentos"})
    }
})

router.post("/", autenticaUsuario, verificaAdmin, async (req,res)=>{
    try{
        const { usuario_id, motivo } = req.body || {};
        if(!Number.isInteger(usuario_id) || usuario_id <= 0 || usuario_id > 2147483647){
            return res.status(400).json({msg: "Id do usuario invalido"})
        }
        if(typeof motivo !== "string" || !motivo.trim() || motivo.length > 500){
            return res.status(400).json({msg: "Motivo invalido"})
        }
        const resultado = await db.transaction(async (client)=>{
            const r1 = await client.query("SELECT admin,banido FROM usuarios WHERE id=$1 FOR UPDATE", [usuario_id])
            if(!r1.rowCount){
                return {status: 404, msg: "Usuario nao encontrado"};
            }
            if(r1.rows[0].admin){
                return {status: 403, msg: "Nao e permitido banir administradores"};
            }
            if(r1.rows[0].banido){
                return {status: 409, msg: "Usuario ja banido"};
            }
            const r2 = await client.query("INSERT INTO banimentos (usuario_id,administrador_id,motivo) VALUES ($1,$2,$3) RETURNING *", [usuario_id, req.usuario.id, motivo.trim()])
            const r3 = await client.query("UPDATE usuarios SET banido=TRUE WHERE id=$1", [usuario_id])
            if(!r2.rowCount || !r3.rowCount){
                throw new Error("Usuario nao banido")
            }
            return {status: 201, msg: "Usuario banido", banimento: r2.rows[0]};
        })
        const { status, ...dados } = resultado;
        return res.status(status).json(dados)
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao banir usuario"})
    }
})

router.put("/:id", autenticaUsuario, verificaAdmin, verificaId, async (req,res)=>{
    try{
        const resultado = await db.transaction(async (client)=>{
            const r1 = await client.query("SELECT usuario_id FROM banimentos WHERE id=$1", [req.id])
            if(!r1.rowCount){
                return {status: 404, msg: "Banimento nao encontrado"};
            }
            const usuario_id = r1.rows[0].usuario_id;
            const r2 = await client.query("SELECT id FROM usuarios WHERE id=$1 FOR UPDATE", [usuario_id])
            if(!r2.rowCount){
                return {status: 404, msg: "Usuario nao encontrado"};
            }
            const r3 = await client.query("UPDATE banimentos SET ativo=FALSE WHERE id=$1 AND ativo=TRUE RETURNING *", [req.id])
            if(!r3.rowCount){
                return {status: 409, msg: "Banimento ja desativado"};
            }
            const r4 = await client.query("SELECT id FROM banimentos WHERE usuario_id=$1 AND ativo=TRUE", [usuario_id])
            if(!r4.rowCount){
                const r5 = await client.query("UPDATE usuarios SET banido=FALSE WHERE id=$1", [usuario_id])
                if(!r5.rowCount){
                    throw new Error("Usuario nao desbanido")
                }
            }
            return {status: 200, msg: "Banimento desativado", banimento: r3.rows[0]};
        })
        const { status, ...dados } = resultado;
        return res.status(status).json(dados)
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao desbanir usuario"})
    }
})

module.exports = router;
