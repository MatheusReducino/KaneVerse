
const express = require("express")
const router = express.Router()
const db = require("../db")

router.get("/", async (req, res) =>{
    try{
        const r = await db.query("SELECT c.id, c.texto, c.data_comentario, c.usuario_id, c.post_id, u.nome_usuario FROM comentariosposts c INNER JOIN usuarios u ON c.usuario_id = u.id ORDER BY c.data_comentario DESC")
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/:id", async (req, res) =>{
    try{
        const id = req.params.id
        const r = await db.query("SELECT c.id, c.texto, c.data_comentario, c.usuario_id, c.post_id, u.nome_usuario FROM comentariosposts c INNER JOIN usuarios u ON c.usuario_id = u.id WHERE c.id = $1", [id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Comentario nao encontrado"})
        }
        res.status(200).json(r.rows[0])
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/post/:id", async (req, res) =>{
    try{
        const id = req.params.id
        const r = await db.query("SELECT c.id, c.texto, c.data_comentario, c.usuario_id, c.post_id, u.nome_usuario FROM comentariosposts c INNER JOIN usuarios u ON c.usuario_id = u.id WHERE c.post_id = $1 ORDER BY c.data_comentario DESC", [id])
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.post("/", async (req, res) =>{
    try{
        const { texto, usuario_id, post_id } = req.body
        if(!texto || !usuario_id || !post_id){
            return res.status(400).json({msg: "Preencha o texto, usuário e publicação!"})
        }
        const usuario = await db.query("SELECT id, banido FROM usuarios WHERE id = $1", [usuario_id])
        if(!usuario.rowCount){
            return res.status(404).json({msg: "Usuario nao encontrado"})
        }
        if(usuario.rows[0].banido){
            return res.status(403).json({msg: "Usuario banido nao pode comentar"})
        }
        const post = await db.query("SELECT id FROM posts WHERE id = $1", [post_id])
        if(!post.rowCount){
            return res.status(404).json({msg: "Publicacao nao encontrada"})
        }
        const r = await db.query("INSERT INTO comentariosposts (texto, usuario_id, post_id) VALUES ($1, $2, $3) RETURNING *", [texto, usuario_id, post_id])
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
            return res.status(400).json({msg: "Informe o texto do comentario!"})
        }
        const r = await db.query("UPDATE comentariosposts SET texto = $1 WHERE id = $2 RETURNING *", [texto, id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Comentario nao encontrado"})
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
        const r = await db.query("DELETE FROM comentariosposts WHERE id = $1 RETURNING id, texto", [id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Comentario nao encontrado"})
        }
        res.status(200).json({msg: "Comentario excluido com sucesso", comentario: r.rows[0]})
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

module.exports = router
