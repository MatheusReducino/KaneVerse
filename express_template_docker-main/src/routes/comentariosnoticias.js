const express = require("express");
const router = express.Router();
const db = require("../db");
const { idValido, textoValido } = require("../middlewares/validacoes");
const { verificarToken, podeAlterar } = require("../middlewares/auth");
const lista = "SELECT c.id, c.texto, c.data_comentario, c.usuario_id, c.noticia_id, u.nome_usuario FROM comentariosnoticias c JOIN usuarios u ON c.usuario_id=u.id";

router.get("/", async (req, res)=>{
    try{
        const r = await db.query(lista + " ORDER BY c.data_comentario DESC");
        return res.status(200).json(r.rows);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.get("/noticia/:id", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }
        const r = await db.query(lista + " WHERE c.noticia_id=$1 ORDER BY c.data_comentario DESC", [req.params.id]);
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

        const r = await db.query(lista + " WHERE c.id=$1", [req.params.id]);
        if (!r.rowCount){
            return res.status(404).json({ msg: "Comentario nao encontrado" })
        }
        return res.status(200).json(r.rows[0]);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})

router.use(verificarToken);
router.post("/", async (req, res)=>{
    try{
        const { texto, noticia_id } = req.body || {};
        if (!textoValido(texto, 1000)){
            return res.status(400).json({ msg: "texto invalido (maximo 1000 caracteres)" })
        }
        if (!idValido(noticia_id)){
            return res.status(400).json({ msg: "noticia_id deve ser um inteiro positivo" })
        }
        if (typeof texto !== "string" || !texto.trim() || !noticia_id){
            return res.status(400).json({ msg: "Informe texto e noticia_id" })
        }
        const alvo = await db.query("SELECT id FROM noticias WHERE id=$1", [noticia_id]);
        if (!alvo.rowCount){
            return res.status(404).json({ msg: "Conteudo nao encontrado" })
        }
        const comentario = await db.transaction(async (conexao)=>{
            const r = await conexao.query("INSERT INTO comentariosnoticias (texto, usuario_id, noticia_id) VALUES ($1,$2,$3) RETURNING *", [texto.trim(), req.usuario.id, noticia_id]);
            await conexao.query("UPDATE usuarios SET kane_points=kane_points+5 WHERE id=$1", [req.usuario.id]);
            return r.rows[0];
        })
        return res.status(201).json({ msg: "Comentario criado (+5 Kane Points)", comentario })
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.put("/:id", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const { texto } = req.body || {};
        if (!textoValido(texto, 1000)){
            return res.status(400).json({ msg: "texto invalido (maximo 1000 caracteres)" })
        }
        if (typeof texto !== "string" || !texto.trim()){
            return res.status(400).json({ msg: "Informe texto" })
        }
        const dono = await db.query("SELECT usuario_id FROM comentariosnoticias WHERE id=$1", [req.params.id]);
        if (!dono.rowCount){
            return res.status(404).json({ msg: "Comentario nao encontrado" })
        }
        if (!podeAlterar(req.usuario, dono.rows[0].usuario_id)){
            return res.status(403).json({ msg: "Sem permissao" })
        }
        const r = await db.query("UPDATE comentariosnoticias SET texto=$1 WHERE id=$2 RETURNING *", [texto.trim(), req.params.id]);
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

        const dono = await db.query("SELECT usuario_id FROM comentariosnoticias WHERE id=$1", [req.params.id]);
        if (!dono.rowCount){
            return res.status(404).json({ msg: "Comentario nao encontrado" })
        }
        if (!podeAlterar(req.usuario, dono.rows[0].usuario_id)){
            return res.status(403).json({ msg: "Sem permissao" })
        }
        const r = await db.query("DELETE FROM comentariosnoticias WHERE id=$1 RETURNING id", [req.params.id]);
        return res.status(200).json({ msg: "Comentario excluido", comentario: r.rows[0] })
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
module.exports = router;
