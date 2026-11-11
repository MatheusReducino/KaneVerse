
const express = require("express")
const router = express.Router()
const db = require("../db")

router.get("/", async (req, res) =>{
    try{
        const r = await db.query("SELECT p.id, p.texto, p.editado, p.data_post, p.usuario_id, u.nome_usuario FROM posts p INNER JOIN usuarios u ON p.usuario_id = u.id ORDER BY p.data_post DESC")
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/:id", async (req, res) =>{
    try{
        const id = req.params.id
        const r = await db.query("SELECT p.id, p.texto, p.editado, p.data_post, p.usuario_id, u.nome_usuario FROM posts p INNER JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = $1", [id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Publicacao nao encontrada"})
        }
        res.status(200).json(r.rows[0])
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/usuario/:id", async (req, res) =>{
    try{
        const id = req.params.id
        const r = await db.query("SELECT p.id, p.texto, p.editado, p.data_post, p.usuario_id, u.nome_usuario FROM posts p INNER JOIN usuarios u ON p.usuario_id = u.id WHERE p.usuario_id = $1 ORDER BY p.data_post DESC", [id])

        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.post("/", async (req, res) =>{
    try{
        const { texto, usuario_id } = req.body

        if(!texto || !usuario_id){
            return res.status(400).json({msg: "Preencha o texto e o ID do usuário!"})
        }
        const usuario = await db.query("SELECT id, banido FROM usuarios WHERE id = $1", [usuario_id])

        if(!usuario.rowCount){
            return res.status(404).json({msg: "Usuario nao encontrado"})
        }
        if(usuario.rows[0].banido){
            return res.status(403).json({msg: "Usuario banido nao pode publicar"})
        }
        const r = await db.query("INSERT INTO posts (texto, usuario_id) VALUES ($1, $2) RETURNING *", [texto, usuario_id])

        res.status(201).json(r.rows[0])
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.put("/:id", async (req, res) =>{
    try{
        const id = req.params.id
        const { texto } = req.body

        if(!texto){
            return res.status(400).json({msg: "Informe o texto da publicacao!"})
        }
        const r = await db.query("UPDATE posts SET texto = $1, editado = true WHERE id = $2 RETURNING *", [texto, id])

        if(!r.rowCount){
            return res.status(404).json({msg: "Publicacao nao encontrada"})
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
        const r = await db.query("DELETE FROM posts WHERE id = $1 RETURNING id, texto", [id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Publicacao nao encontrada"})
        }
        res.status(200).json({msg: "Publicacao excluida com sucesso", post: r.rows[0]})
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/:id/palavraschave", async (req, res) =>{
    try{
        const id = req.params.id
        const r = await db.query("SELECT p.id, p.texto, pk.id AS palavra_id, pk.palavra FROM posts p INNER JOIN post_palavrachave pp ON p.id = pp.post_id INNER JOIN palavraschave pk ON pp.palavra_id = pk.id WHERE p.id = $1", [id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Publicacao ou palavras-chave nao encontradas"})
        }
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

module.exports = router
