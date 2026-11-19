const express = require("express");
const router = express.Router();
const db = require("../db");
const { idValido, textoValido } = require("../middlewares/validacoes");
const { verificarToken, podeAlterar } = require("../middlewares/auth");
const { upload, imagemValida } = require("../middlewares/imagem");
const lista = "SELECT n.id, n.titulo, n.subtitulo, n.conteudo, n.categoria, n.editada, n.data_noticia, n.usuario_id, u.nome_usuario FROM noticias n JOIN usuarios u ON u.id=n.usuario_id";

router.get("/", async (req, res)=>{
    try{
        const r = await db.query(lista + " ORDER BY n.data_noticia DESC");
        return res.status(200).json(r.rows);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.get("/categoria/:categoria", async (req, res)=>{
    try{
        if (!textoValido(req.params.categoria, 50)){
            return res.status(400).json({ msg: "Categoria invalida" })
        }
        const r = await db.query(lista + " WHERE LOWER(n.categoria)=LOWER($1) ORDER BY n.data_noticia DESC", [req.params.categoria]);
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
        const r = await db.query("SELECT p.id, p.palavra FROM noticia_palavrachave np JOIN palavraschave p ON p.id=np.palavra_id WHERE np.noticia_id=$1", [req.params.id]);
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

        const r = await db.query("SELECT foto, foto_tipo FROM noticias WHERE id=$1", [req.params.id]);
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

        const r = await db.query(lista + " WHERE n.id=$1", [req.params.id]);
        if (!r.rowCount){
            return res.status(404).json({ msg: "Noticia nao encontrada" })
        }
        return res.status(200).json(r.rows[0]);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})

router.use(verificarToken);

router.post("/", async (req, res)=>{
    try{
        const { titulo, subtitulo, conteudo, categoria } = req.body || {};
        if (categoria != null && !textoValido(categoria, 50)){
            return res.status(400).json({ msg: "categoria invalido (maximo 50 caracteres)" })
        }
        if (!textoValido(conteudo, 20000)){
            return res.status(400).json({ msg: "conteudo invalido (maximo 20000 caracteres)" })
        }
        if (!textoValido(subtitulo, 500)){
            return res.status(400).json({ msg: "subtitulo invalido (maximo 500 caracteres)" })
        }
        if (!textoValido(titulo, 255)){
            return res.status(400).json({ msg: "titulo invalido (maximo 255 caracteres)" })
        }
        if (typeof titulo !== "string" || !titulo.trim() || typeof subtitulo !== "string" || !subtitulo.trim() || typeof conteudo !== "string" || !conteudo.trim()){
            return res.status(400).json({ msg: "Preencha titulo, subtitulo e conteudo" })
        }
        if (categoria != null && (typeof categoria !== "string" || !categoria.trim())){
            return res.status(400).json({ msg: "Categoria invalida" })
        }
        const r = await db.query("INSERT INTO noticias (titulo, subtitulo, conteudo, categoria, usuario_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, titulo, subtitulo, categoria, usuario_id", [titulo.trim(), subtitulo.trim(), conteudo.trim(), categoria || "Harry Kane", req.usuario.id]);
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

        const { titulo, subtitulo, conteudo, categoria } = req.body || {};
        if (categoria != null && !textoValido(categoria, 50)){
            return res.status(400).json({ msg: "categoria invalido (maximo 50 caracteres)" })
        }
        if (!textoValido(conteudo, 20000)){
            return res.status(400).json({ msg: "conteudo invalido (maximo 20000 caracteres)" })
        }
        if (!textoValido(subtitulo, 500)){
            return res.status(400).json({ msg: "subtitulo invalido (maximo 500 caracteres)" })
        }
        if (!textoValido(titulo, 255)){
            return res.status(400).json({ msg: "titulo invalido (maximo 255 caracteres)" })
        }
        if (typeof titulo !== "string" || !titulo.trim() || typeof subtitulo !== "string" || !subtitulo.trim() || typeof conteudo !== "string" || !conteudo.trim()){
            return res.status(400).json({ msg: "Preencha titulo, subtitulo e conteudo" })
        }
        if (categoria != null && (typeof categoria !== "string" || !categoria.trim())){
            return res.status(400).json({ msg: "Categoria invalida" })
        }
        const dono = await db.query("SELECT usuario_id FROM noticias WHERE id=$1", [req.params.id]);
        if (!dono.rowCount){
            return res.status(404).json({ msg: "Noticia nao encontrada" })
        }
        if (!podeAlterar(req.usuario, dono.rows[0].usuario_id)){
            return res.status(403).json({ msg: "Sem permissao" })
        }
        const r = await db.query("UPDATE noticias SET titulo=$1, subtitulo=$2, conteudo=$3, categoria=$4, editada=true WHERE id=$5 RETURNING id, titulo, editada", [titulo.trim(), subtitulo.trim(), conteudo.trim(), categoria || "Harry Kane", req.params.id]);
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

        const dono = await db.query("SELECT usuario_id FROM noticias WHERE id=$1", [req.params.id]);
        if (!dono.rowCount){
            return res.status(404).json({ msg: "Noticia nao encontrada" })
        }
        if (!podeAlterar(req.usuario, dono.rows[0].usuario_id)){
            return res.status(403).json({ msg: "Sem permissao" })
        }
        if (!imagemValida(req.file)){
            return res.status(400).json({ msg: "Imagem deve ser JPG, PNG ou WEBP ate 3 MB" })
        }
        await db.query("UPDATE noticias SET foto=$1, foto_tipo=$2 WHERE id=$3", [req.file.buffer, req.file.mimetype, req.params.id]);
        return res.status(200).json({ msg: "Foto salva", url: `/noticias/${req.params.id}/foto` })
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.delete("/:id/foto", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const dono = await db.query("SELECT usuario_id FROM noticias WHERE id=$1", [req.params.id]);
        if (!dono.rowCount){
            return res.status(404).json({ msg: "Noticia nao encontrada" })
        }
        if (!podeAlterar(req.usuario, dono.rows[0].usuario_id)){
            return res.status(403).json({ msg: "Sem permissao" })
        }
        await db.query("UPDATE noticias SET foto=NULL, foto_tipo=NULL WHERE id=$1", [req.params.id]);
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

        const dono = await db.query("SELECT usuario_id FROM noticias WHERE id=$1", [req.params.id]);
        if (!dono.rowCount){
            return res.status(404).json({ msg: "Noticia nao encontrada" })
        }
        if (!podeAlterar(req.usuario, dono.rows[0].usuario_id)){
            return res.status(403).json({ msg: "Sem permissao" })
        }
        const r = await db.query("DELETE FROM noticias WHERE id=$1 RETURNING id, titulo", [req.params.id]);
        return res.status(200).json({ msg: "Noticia removida", noticia: r.rows[0] })
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
module.exports = router;
