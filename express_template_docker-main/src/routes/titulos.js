const express = require("express");
const router = express.Router();
const db = require("../db");
const { idValido, textoValido } = require("../middlewares/validacoes");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");

router.get("/", async (req, res)=>{
    try{
        const r = await db.query("SELECT * FROM titulos ORDER BY kane_points_desbloqueio");
        return res.status(200).json(r.rows);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.get("/:id/usuarios", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }
        const r = await db.query("SELECT u.id, u.nome_usuario, ut.data_desbloqueio FROM usuario_titulo ut JOIN usuarios u ON u.id=ut.usuario_id WHERE ut.titulo_id=$1", [req.params.id]);
        return res.status(200).json(r.rows);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.get("/:id", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const r = await db.query("SELECT * FROM titulos WHERE id=$1", [req.params.id]);
        if (!r.rowCount){
            return res.status(404).json({ msg: "Titulo nao encontrado" })
        }
        return res.status(200).json(r.rows[0]);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.use(verificarToken, verificarAdmin);
router.post("/", async (req, res)=>{
    try{
        const { nome_titulo, descricao, kane_points_desbloqueio } = req.body || {};
        if (!textoValido(descricao, 200)){
            return res.status(400).json({ msg: "descricao invalido (maximo 200 caracteres)" })
        }
        if (!textoValido(nome_titulo, 50)){
            return res.status(400).json({ msg: "nome_titulo invalido (maximo 50 caracteres)" })
        }
        if (typeof nome_titulo !== "string" || !nome_titulo.trim() || typeof descricao !== "string" || !descricao.trim() || !Number.isInteger(kane_points_desbloqueio) || (kane_points_desbloqueio < 0 || kane_points_desbloqueio > 1000000)){
            return res.status(400).json({ msg: "Informe nome, descricao e pontos inteiros >= 0" })
        }
        const existe = await db.query("SELECT id FROM titulos WHERE nome_titulo=$1", [nome_titulo.trim()]);
        if (existe.rowCount){
            return res.status(409).json({ msg: "Titulo ja existe" })
        }
        const r = await db.query("INSERT INTO titulos (nome_titulo, descricao, kane_points_desbloqueio) VALUES ($1,$2,$3) RETURNING *", [nome_titulo.trim(), descricao.trim(), kane_points_desbloqueio]);
        return res.status(201).json(r.rows[0]);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.put("/:id", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const { nome_titulo, descricao, kane_points_desbloqueio } = req.body || {};
        if (!textoValido(descricao, 200)){
            return res.status(400).json({ msg: "descricao invalido (maximo 200 caracteres)" })
        }
        if (!textoValido(nome_titulo, 50)){
            return res.status(400).json({ msg: "nome_titulo invalido (maximo 50 caracteres)" })
        }
        if (typeof nome_titulo !== "string" || !nome_titulo.trim() || typeof descricao !== "string" || !descricao.trim() || !Number.isInteger(kane_points_desbloqueio) || (kane_points_desbloqueio < 0 || kane_points_desbloqueio > 1000000)){
            return res.status(400).json({ msg: "Dados invalidos" })
        }
        const existe = await db.query("SELECT id FROM titulos WHERE nome_titulo=$1 AND id<>$2", [nome_titulo.trim(), req.params.id]);
        if (existe.rowCount){
            return res.status(409).json({ msg: "Outro titulo ja possui este nome" })
        }
        const r = await db.query("UPDATE titulos SET nome_titulo=$1, descricao=$2, kane_points_desbloqueio=$3 WHERE id=$4 RETURNING *", [nome_titulo.trim(), descricao.trim(), kane_points_desbloqueio, req.params.id]);
        if (!r.rowCount){
            return res.status(404).json({ msg: "Titulo nao encontrado" })
        }
        return res.status(200).json(r.rows[0]);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.delete("/:id", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const r = await db.query("DELETE FROM titulos WHERE id=$1 RETURNING *", [req.params.id]);
        if (!r.rowCount){
            return res.status(404).json({ msg: "Titulo nao encontrado" })
        }
        return res.status(200).json({ msg: "Titulo removido", titulo: r.rows[0] })
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
module.exports = router;
