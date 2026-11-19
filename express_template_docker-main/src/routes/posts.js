const express = require("express");
const router = express.Router();
const db = require("../db");
const { idValido, textoValido } = require("../middlewares/validacoes");
const { verificarToken, podeAlterar } = require("../middlewares/auth");
const { upload, imagemValida } = require("../middlewares/imagem");
const lista = "SELECT p.id, p.texto, p.editado, p.data_post, p.usuario_id, u.nome_usuario FROM posts p JOIN usuarios u ON u.id=p.usuario_id";

router.get("/", async (req, res)=>{
    try{
        const r = await db.query(lista + " ORDER BY p.data_post DESC");
        return res.status(200).json(r.rows);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.get("/usuario/:id", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const r = await db.query(lista + " WHERE p.usuario_id=$1 ORDER BY p.data_post DESC", [req.params.id]);
        return res.status(200).json(r.rows);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.get("/:id/palavraschave", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const r = await db.query("SELECT pc.id, pc.palavra FROM post_palavrachave pp JOIN palavraschave pc ON pc.id=pp.palavra_id WHERE pp.post_id=$1", [req.params.id]);
        return res.status(200).json(r.rows);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.get("/:id/foto", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const r = await db.query("SELECT foto, foto_tipo FROM posts WHERE id=$1", [req.params.id]);
        if (!r.rowCount || !r.rows[0].foto){
            return res.status(404).json({ msg: "Foto nao encontrada" })
        }
        res.type(r.rows[0].foto_tipo || "image/jpeg");
        return res.send(r.rows[0].foto);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.get("/:id", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const r = await db.query(lista + " WHERE p.id=$1", [req.params.id]);
        if (!r.rowCount){
            return res.status(404).json({ msg: "Post nao encontrado" })
        }
        return res.status(200).json(r.rows[0]);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})

router.use(verificarToken);
router.post("/", async (req, res)=>{
    try{
        const { texto } = req.body || {};
        if (!textoValido(texto, 5000)){
            return res.status(400).json({ msg: "texto invalido (maximo 5000 caracteres)" })
        }
        if (typeof texto !== "string" || !texto.trim()){
            return res.status(400).json({ msg: "Informe o texto" })
        }
        const post = await db.transaction(async (conexao)=>{
            const r = await conexao.query("INSERT INTO posts (texto, usuario_id) VALUES ($1,$2) RETURNING id, texto, usuario_id, data_post", [texto.trim(), req.usuario.id]);
            await conexao.query("UPDATE usuarios SET kane_points=kane_points+10 WHERE id=$1", [req.usuario.id]);
            return r.rows[0];
        })
        return res.status(201).json({ msg: "Post criado (+10 Kane Points)", post })
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
        if (!textoValido(texto, 5000)){
            return res.status(400).json({ msg: "texto invalido (maximo 5000 caracteres)" })
        }
        if (typeof texto !== "string" || !texto.trim()){
            return res.status(400).json({ msg: "Informe o texto" })
        }
        const dono = await db.query("SELECT usuario_id FROM posts WHERE id=$1", [req.params.id]);
        if (!dono.rowCount){
            return res.status(404).json({ msg: "Post nao encontrado" })
        }
        if (!podeAlterar(req.usuario, dono.rows[0].usuario_id)){
            return res.status(403).json({ msg: "Voce nao e dono deste post" })
        }
        const r = await db.query("UPDATE posts SET texto=$1, editado=true WHERE id=$2 RETURNING id, texto, editado, usuario_id", [texto.trim(), req.params.id]);
        return res.status(200).json(r.rows[0]);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.put("/:id/foto", upload.single("imagem"), async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const dono = await db.query("SELECT usuario_id FROM posts WHERE id=$1", [req.params.id]);
        if (!dono.rowCount){
            return res.status(404).json({ msg: "Post nao encontrado" })
        }
        if (!podeAlterar(req.usuario, dono.rows[0].usuario_id)){
            return res.status(403).json({ msg: "Sem permissao" })
        }
        if (!imagemValida(req.file)){
            return res.status(400).json({ msg: "Imagem deve ser JPG, PNG ou WEBP ate 3 MB" })
        }
        await db.query("UPDATE posts SET foto=$1, foto_tipo=$2 WHERE id=$3", [req.file.buffer, req.file.mimetype, req.params.id]);
        return res.status(200).json({ msg: "Foto salva", url: `/posts/${req.params.id}/foto` })
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.delete("/:id/foto", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const dono = await db.query("SELECT usuario_id FROM posts WHERE id=$1", [req.params.id]);
        if (!dono.rowCount){
            return res.status(404).json({ msg: "Post nao encontrado" })
        }
        if (!podeAlterar(req.usuario, dono.rows[0].usuario_id)){
            return res.status(403).json({ msg: "Sem permissao" })
        }
        await db.query("UPDATE posts SET foto=NULL, foto_tipo=NULL WHERE id=$1", [req.params.id]);
        return res.status(200).json({ msg: "Foto removida" })
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.delete("/:id", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const dono = await db.query("SELECT usuario_id FROM posts WHERE id=$1", [req.params.id]);
        if (!dono.rowCount){
            return res.status(404).json({ msg: "Post nao encontrado" })
        }
        if (!podeAlterar(req.usuario, dono.rows[0].usuario_id)){
            return res.status(403).json({ msg: "Sem permissao" })
        }
        const r = await db.query("DELETE FROM posts WHERE id=$1 RETURNING id", [req.params.id]);
        return res.status(200).json({ msg: "Post excluido", post: r.rows[0] })
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
module.exports = router;
