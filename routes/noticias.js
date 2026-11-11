
const express = require("express")
const router = express.Router()
const db = require("../db")

router.get("/", async (req, res) =>{
    try{
        const r = await db.query("SELECT n.id, n.titulo, n.subtitulo, n.conteudo, n.categoria, n.editada, n.data_noticia, n.usuario_id, u.nome_usuario FROM noticias n INNER JOIN usuarios u ON n.usuario_id = u.id ORDER BY n.data_noticia DESC")
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/:id", async (req, res) =>{
    try{
        const id = req.params.id
        const r = await db.query("SELECT n.id, n.titulo, n.subtitulo, n.conteudo, n.categoria, n.editada, n.data_noticia, n.usuario_id, u.nome_usuario FROM noticias n INNER JOIN usuarios u ON n.usuario_id = u.id WHERE n.id = $1", [id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Noticia nao encontrada"})
        }
        res.status(200).json(r.rows[0])
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/categoria/:categoria", async (req, res) =>{
    try{
        const categoria = req.params.categoria
        const r = await db.query("SELECT n.id, n.titulo, n.subtitulo, n.categoria, n.data_noticia, u.nome_usuario FROM noticias n INNER JOIN usuarios u ON n.usuario_id = u.id WHERE LOWER(n.categoria) = LOWER($1) ORDER BY n.data_noticia DESC", [categoria])
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/:id/palavraschave", async (req, res) =>{
    try{
        const id = req.params.id
        const r = await db.query("SELECT n.id AS noticia_id, n.titulo, p.id AS palavra_id, p.palavra FROM noticias n INNER JOIN noticia_palavrachave np ON n.id = np.noticia_id INNER JOIN palavraschave p ON np.palavra_id = p.id WHERE n.id = $1", [id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Noticia ou palavras-chave nao encontradas"})
        }
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.post("/", async (req, res) =>{
    try{
        const { titulo, subtitulo, conteudo, categoria, usuario_id } = req.body
        if(!titulo || !conteudo || !usuario_id){
            return res.status(400).json({msg: "Preencha o titulo, conteudo e ID do usuario!"})
        }
        const usuario = await db.query("SELECT id, cargo, banido FROM usuarios WHERE id = $1", [usuario_id])
        if(!usuario.rowCount){
            return res.status(404).json({msg: "Usuario nao encontrado"})
        }
        if(usuario.rows[0].banido){
            return res.status(403).json({msg: "Usuario banido nao pode publicar noticias"})
        }
        if(usuario.rows[0].cargo !== "admin"){
            return res.status(403).json({msg: "Apenas administradores podem publicar noticias"})
        }
        const r = await db.query("INSERT INTO noticias (titulo, subtitulo, conteudo, categoria, usuario_id) VALUES ($1, $2, $3, $4, $5) RETURNING *", [titulo, subtitulo || null, conteudo, categoria || "Harry Kane", usuario_id])
        res.status(201).json(r.rows[0])
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.put("/:id", async (req, res) =>{
    try{
        const id = req.params.id
        const { titulo, subtitulo, conteudo, categoria } = req.body
        if(!titulo || !conteudo){
            return res.status(400).json({msg: "Preencha o titulo e o conteudo!"})
        }
        const r = await db.query("UPDATE noticias SET titulo = $1, subtitulo = $2, conteudo = $3, categoria = $4, editada = true WHERE id = $5 RETURNING *", [titulo, subtitulo || null, conteudo, categoria || "Harry Kane", id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Noticia nao encontrada"})
        }
        res.status(200).json(r.rows[0])
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})
router.delete("/:id", async (req, res) =>{
    try{
        const id = req.params.id
        const r = await db.query("DELETE FROM noticias WHERE id = $1 RETURNING id, titulo", [id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Noticia nao encontrada"})
        }
        res.status(200).json({msg: "Noticia excluida com sucesso", noticia: r.rows[0]})
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

module.exports = router
