
const express = require("express")
const router = express.Router()
const db = require("../db")

router.get("/", async (req, res) =>{
    try{
        const r = await db.query("SELECT np.*, n.titulo AS noticia, p.palavra AS palavra_chave FROM noticia_palavrachave np INNER JOIN noticias n ON np.noticia_id = n.id INNER JOIN palavraschave p ON np.palavra_id = p.id ORDER BY np.noticia_id")
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/noticia/:id", async (req, res) =>{
    try{
        const { id } = req.params
        const r = await db.query("SELECT p.* FROM noticia_palavrachave np INNER JOIN palavraschave p ON np.palavra_id = p.id WHERE np.noticia_id = $1", [id])
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/palavra/:id", async (req, res) =>{
    try{
        const { id } = req.params
        const r = await db.query("SELECT n.* FROM noticia_palavrachave np INNER JOIN noticias n ON np.noticia_id = n.id WHERE np.palavra_id = $1", [id])
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.post("/", async (req, res) =>{
    try{
        const { noticia_id, palavra_id } = req.body
        if(!noticia_id || !palavra_id){
            return res.status(400).json({msg: "Informe a noticia e a palavra-chave"})
        }
        const r = await db.query("INSERT INTO noticia_palavrachave (noticia_id, palavra_id) VALUES ($1, $2) RETURNING *", [noticia_id, palavra_id])
        res.status(201).json(r.rows[0])
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.delete("/:noticia_id/:palavra_id", async (req, res) =>{
    try{
        const { noticia_id, palavra_id } = req.params
        const r = await db.query("DELETE FROM noticia_palavrachave WHERE noticia_id = $1 AND palavra_id = $2 RETURNING *", [noticia_id, palavra_id])
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
