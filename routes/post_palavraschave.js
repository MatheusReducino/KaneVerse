
const express = require("express")
const router = express.Router()
const db = require("../db")

router.get("/", async (req, res) =>{
    try{
        const r = await db.query("SELECT pp.*, p.texto AS post, pk.palavra AS palavra_chave FROM post_palavrachave pp INNER JOIN posts p ON pp.post_id = p.id INNER JOIN palavraschave pk ON pp.palavra_id = pk.id ORDER BY pp.post_id")
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/post/:id", async (req, res) =>{
    try{
        const { id } = req.params
        const r = await db.query("SELECT pk.* FROM post_palavrachave pp INNER JOIN palavraschave pk ON pp.palavra_id = pk.id WHERE pp.post_id = $1", [id])
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/palavra/:id", async (req, res) =>{
    try{
        const { id } = req.params
        const r = await db.query("SELECT p.* FROM post_palavrachave pp INNER JOIN posts p ON pp.post_id = p.id WHERE pp.palavra_id = $1", [id])
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.post("/", async (req, res) =>{
    try{
        const { post_id, palavra_id } = req.body
        if(!post_id || !palavra_id){
            return res.status(400).json({msg: "Informe o post e a palavra-chave"})
        }
        const r = await db.query("INSERT INTO post_palavrachave (post_id, palavra_id) VALUES ($1, $2) RETURNING *", [post_id, palavra_id])
        res.status(201).json(r.rows[0])
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.delete("/:post_id/:palavra_id", async (req, res) =>{
    try{
        const { post_id, palavra_id } = req.params
        const r = await db.query("DELETE FROM post_palavrachave WHERE post_id = $1 AND palavra_id = $2 RETURNING *", [post_id, palavra_id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Relacao nao encontrada"})
        }
        res.status(200).json({msg: "Relacao removida com sucesso"})
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

module.exports = router
