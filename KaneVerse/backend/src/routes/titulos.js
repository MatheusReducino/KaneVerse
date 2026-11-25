const express = require("express");
const router = express.Router();
const db = require("../db");
const autenticaUsuario = require("../middlewares/autenticaUsuario");
const verificaId = require("../middlewares/verificaId");
const verificaAdmin = require("../middlewares/verificaAdmin");

router.get("/", async (req,res)=>{
    try{
        const r = await db.query("SELECT * FROM titulos ORDER BY kane_points_desbloqueio,id")
        return res.status(200).json(r.rows)
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar titulos"})
    }
})

router.get("/usuario/:id", verificaId, async (req,res)=>{
    try{
        const r1 = await db.query("SELECT id FROM usuarios WHERE id=$1", [req.id])
        if(!r1.rowCount){
            return res.status(404).json({msg: "Usuario nao encontrado"})
        }
        const r2 = await db.query("SELECT t.*,ut.data_desbloqueio FROM usuario_titulo ut JOIN titulos t ON ut.titulo_id=t.id WHERE ut.usuario_id=$1 ORDER BY t.kane_points_desbloqueio", [req.id])
        return res.status(200).json(r2.rows)
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar titulos do usuario"})
    }
})

router.get("/:id", verificaId, async (req,res)=>{
    try{
        const r = await db.query("SELECT * FROM titulos WHERE id=$1", [req.id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Titulo nao encontrado"})
        }
        return res.status(200).json(r.rows[0])
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar titulo"})
    }
})

router.post("/", autenticaUsuario, verificaAdmin, async (req,res)=>{
    try{
        const { nome_titulo, descricao, kane_points_desbloqueio } = req.body || {};
        if(typeof nome_titulo !== "string" || !nome_titulo.trim() || nome_titulo.length > 50){
            return res.status(400).json({msg: "Nome do titulo invalido"})
        }
        if(typeof descricao !== "string" || !descricao.trim() || descricao.length > 200){
            return res.status(400).json({msg: "Descricao invalida"})
        }
        if(!Number.isInteger(kane_points_desbloqueio) || kane_points_desbloqueio < 0 || kane_points_desbloqueio > 2147483647){
            return res.status(400).json({msg: "Quantidade de Kane Points invalida"})
        }
        const r1 = await db.query("SELECT id FROM titulos WHERE nome_titulo=$1", [nome_titulo.trim()])
        if(r1.rowCount){
            return res.status(409).json({msg: "Ja existe um titulo com esse nome"})
        }
        const r2 = await db.query("INSERT INTO titulos (nome_titulo,descricao,kane_points_desbloqueio) VALUES ($1,$2,$3) RETURNING *", [nome_titulo.trim(), descricao.trim(), kane_points_desbloqueio])
        if(!r2.rowCount){
            throw new Error("Titulo nao criado")
        }
        return res.status(201).json({msg: "Titulo criado", titulo: r2.rows[0]})
    } catch (error){
        if(error.code === "23505"){
            return res.status(409).json({msg: "Titulo ja cadastrado"})
        }
        console.error(error)
        return res.status(500).json({msg: "Erro ao criar titulo"})
    }
})

router.put("/:id", autenticaUsuario, verificaAdmin, verificaId, async (req,res)=>{
    try{
        const { nome_titulo, descricao, kane_points_desbloqueio } = req.body || {};
        if(typeof nome_titulo !== "string" || !nome_titulo.trim() || nome_titulo.length > 50){
            return res.status(400).json({msg: "Nome do titulo invalido"})
        }
        if(typeof descricao !== "string" || !descricao.trim() || descricao.length > 200){
            return res.status(400).json({msg: "Descricao invalida"})
        }
        if(!Number.isInteger(kane_points_desbloqueio) || kane_points_desbloqueio < 0 || kane_points_desbloqueio > 2147483647){
            return res.status(400).json({msg: "Quantidade de Kane Points invalida"})
        }
        const r1 = await db.query("SELECT id FROM titulos WHERE nome_titulo=$1 AND id<>$2", [nome_titulo.trim(), req.id])
        if(r1.rowCount){
            return res.status(409).json({msg: "Ja existe um titulo com esse nome"})
        }
        const r2 = await db.query("UPDATE titulos SET nome_titulo=$1,descricao=$2,kane_points_desbloqueio=$3 WHERE id=$4 RETURNING *", [nome_titulo.trim(), descricao.trim(), kane_points_desbloqueio, req.id])
        if(!r2.rowCount){
            return res.status(404).json({msg: "Titulo nao encontrado"})
        }
        return res.status(200).json({msg: "Titulo atualizado", titulo: r2.rows[0]})
    } catch (error){
        if(error.code === "23505"){
            return res.status(409).json({msg: "Titulo ja cadastrado"})
        }
        console.error(error)
        return res.status(500).json({msg: "Erro ao editar titulo"})
    }
})

router.delete("/:id", autenticaUsuario, verificaAdmin, verificaId, async (req,res)=>{
    try{
        const r = await db.query("DELETE FROM titulos WHERE id=$1", [req.id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Titulo nao encontrado"})
        }
        return res.status(200).json({msg: "Titulo excluido"})
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao excluir titulo"})
    }
})

router.post("/:id/desbloquear", autenticaUsuario, verificaId, async (req,res)=>{
    try{
        const resultado = await db.transaction(async (client)=>{
            const r1 = await client.query("SELECT kane_points FROM usuarios WHERE id=$1 FOR UPDATE", [req.usuario.id])
            if(!r1.rowCount){
                return {status: 404, msg: "Usuario nao encontrado"};
            }
            const r2 = await client.query("SELECT kane_points_desbloqueio FROM titulos WHERE id=$1 FOR SHARE", [req.id])
            if(!r2.rowCount){
                return {status: 404, msg: "Titulo nao encontrado"};
            }
            const r3 = await client.query("SELECT usuario_id FROM usuario_titulo WHERE usuario_id=$1 AND titulo_id=$2", [req.usuario.id, req.id])
            if(r3.rowCount){
                return {status: 409, msg: "Voce ja possui esse titulo"};
            }
            if(r1.rows[0].kane_points < r2.rows[0].kane_points_desbloqueio){
                return {status: 403, msg: "Kane Points insuficientes"};
            }
            const r4 = await client.query("INSERT INTO usuario_titulo (usuario_id,titulo_id) VALUES ($1,$2) RETURNING *", [req.usuario.id, req.id])
            return {status: 201, msg: "Titulo desbloqueado", titulo: r4.rows[0]};
        })
        const { status, ...dados } = resultado;
        return res.status(status).json(dados)
    } catch (error){
        if(error.code === "23505"){
            return res.status(409).json({msg: "Voce ja possui esse titulo"})
        }
        console.error(error)
        return res.status(500).json({msg: "Erro ao desbloquear titulo"})
    }
})

module.exports = router;
