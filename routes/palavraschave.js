const express = require("express")
const router = express.Router()
const db = require("../db")

router.get("/", async (req, res) =>{
    try{
        const r = await db.query("SELECT * FROM palavraschave ORDER BY palavra ASC")
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/:id", async (req, res) =>{
    try{
        const id = req.params.id
        const r = await db.query("SELECT * FROM palavraschave WHERE id = $1", [id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Palavra-chave nao encontrada"})
        }
        res.status(200).json(r.rows[0])
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/:id/noticias", async (req, res) =>{
    try{
        const id = req.params.id
        const r = await db.query("SELECT n.id, n.titulo, n.categoria, n.data_noticia FROM noticia_palavrachave np INNER JOIN noticias n ON np.noticia_id = n.id WHERE np.palavra_id = $1 ORDER BY n.data_noticia DESC", [id])
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/:id/posts", async (req, res) =>{
    try{
        const id = req.params.id
        const r = await db.query("SELECT p.id, p.texto, p.data_post FROM post_palavrachave pp INNER JOIN posts p ON pp.post_id = p.id WHERE pp.palavra_id = $1 ORDER BY p.data_post DESC", [id])
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.post("/", async (req, res) =>{
    try{
        const { palavra } = req.body
        if(!palavra){
            return res.status(400).json({msg: "Informe a palavra-chave!"})
        }
        const r = await db.query("INSERT INTO palavraschave (palavra) VALUES ($1) RETURNING *", [palavra])
        res.status(201).json(r.rows[0])
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.put("/:id", async (req, res) =>{
    try{
        const id = req.params.id
        const { palavra } = req.body
        if(!palavra){
            return res.status(400).json({msg: "Informe a nova palavra-chave!"})
        }
        const r = await db.query("UPDATE palavraschave SET palavra = $1 WHERE id = $2 RETURNING *", [palavra, id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Palavra-chave nao encontrada"})
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
        const r = await db.query("DELETE FROM palavraschave WHERE id = $1 RETURNING *", [id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Palavra-chave nao encontrada"})
        }
        res.status(200).json({msg: "Palavra-chave excluida com sucesso", palavra: r.rows[0]})
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

module.exports = router
