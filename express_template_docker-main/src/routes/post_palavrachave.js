const express = require("express");
const router = express.Router();
const db = require("../db");
const { idValido } = require("../middlewares/validacoes");
const { verificarToken, podeAlterar } = require("../middlewares/auth");

router.get("/", async (req, res)=>{
    try{
        const r = await db.query("SELECT rel.*, p.palavra FROM post_palavrachave rel JOIN palavraschave p ON rel.palavra_id=p.id ORDER BY rel.post_id");
        return res.status(200).json(r.rows);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.get("/post/:id", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const r = await db.query("SELECT p.id, p.palavra FROM post_palavrachave rel JOIN palavraschave p ON rel.palavra_id=p.id WHERE rel.post_id=$1", [req.params.id]);
        return res.status(200).json(r.rows);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.get("/palavra/:id", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const r = await db.query("SELECT c.id FROM post_palavrachave rel JOIN posts c ON c.id=rel.post_id WHERE rel.palavra_id=$1", [req.params.id]);
        return res.status(200).json(r.rows);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})

router.use(verificarToken);
router.post("/", async (req, res)=>{
    try{
        const { post_id, palavra_id } = req.body || {};
        if (!idValido(palavra_id)){
            return res.status(400).json({ msg: "palavra_id deve ser um inteiro positivo" })
        }
        if (!idValido(post_id)){
            return res.status(400).json({ msg: "post_id deve ser um inteiro positivo" })
        }
        if (!post_id || !palavra_id){
            return res.status(400).json({ msg: "Informe post_id e palavra_id" })
        }
        const dono = await db.query("SELECT usuario_id FROM posts WHERE id=$1", [post_id]);
        if (!dono.rowCount){
            return res.status(404).json({ msg: "Conteudo nao encontrado" })
        }
        if (!podeAlterar(req.usuario, dono.rows[0].usuario_id)){
            return res.status(403).json({ msg: "Sem permissao" })
        }
        const palavra = await db.query("SELECT id FROM palavraschave WHERE id=$1", [palavra_id]);
        if (!palavra.rowCount){
            return res.status(404).json({ msg: "Palavra nao encontrada" })
        }
        const existe = await db.query("SELECT 1 FROM post_palavrachave WHERE post_id=$1 AND palavra_id=$2", [post_id, palavra_id]);
        if (existe.rowCount){
            return res.status(409).json({ msg: "Relacao ja existe" })
        }
        const r = await db.query("INSERT INTO post_palavrachave (post_id, palavra_id) VALUES ($1,$2) RETURNING *", [post_id, palavra_id]);
        return res.status(201).json(r.rows[0]);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.delete("/:post_id/:palavra_id", async (req, res)=>{
    try{
        if (!idValido(req.params.post_id) || !idValido(req.params.palavra_id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const dono = await db.query("SELECT usuario_id FROM posts WHERE id=$1", [req.params.post_id]);
        if (!dono.rowCount){
            return res.status(404).json({ msg: "Conteudo nao encontrado" })
        }
        if (!podeAlterar(req.usuario, dono.rows[0].usuario_id)){
            return res.status(403).json({ msg: "Sem permissao" })
        }
        const r = await db.query("DELETE FROM post_palavrachave WHERE post_id=$1 AND palavra_id=$2 RETURNING *", [req.params.post_id, req.params.palavra_id]);
        if (!r.rowCount){
            return res.status(404).json({ msg: "Relacao nao encontrada" })
        }
        return res.status(200).json({ msg: "Relacao removida" })
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
module.exports = router;
