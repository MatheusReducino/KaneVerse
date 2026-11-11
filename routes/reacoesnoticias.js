
const express = require("express")
const router = express.Router()
const db = require("../db")

router.get("/", async (req, res) =>{
    try{
        const r = await db.query("SELECT rn.id, rn.tipo, rn.usuario_id, rn.noticia_id, u.nome_usuario FROM reacoesnoticias rn INNER JOIN usuarios u ON rn.usuario_id = u.id ORDER BY rn.id DESC")
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/noticia/:id", async (req, res) =>{
    try{
        const id = req.params.id
        const r = await db.query("SELECT rn.id, rn.tipo, rn.usuario_id, rn.noticia_id, u.nome_usuario FROM reacoesnoticias rn INNER JOIN usuarios u ON rn.usuario_id = u.id WHERE rn.noticia_id = $1", [id])
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/resumo/:id", async (req, res) =>{
    try{
        const id = req.params.id
        const r = await db.query("SELECT tipo, COUNT(*) AS quantidade FROM reacoesnoticias WHERE noticia_id = $1 GROUP BY tipo ORDER BY quantidade DESC", [id])
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/usuario/:usuario_id/noticia/:noticia_id", async (req, res) =>{
    try{
        const { usuario_id, noticia_id } = req.params
        const r = await db.query("SELECT * FROM reacoesnoticias WHERE usuario_id = $1 AND noticia_id = $2", [usuario_id, noticia_id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Reacao nao encontrada"})
        }
        res.status(200).json(r.rows[0])
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.post("/", async (req, res) =>{
    try{
        const { tipo, usuario_id, noticia_id } = req.body
        const tipos = ["curtida", "fogo", "caveira", "risada"]
        if(!tipo || !usuario_id || !noticia_id){
            return res.status(400).json({msg: "Preencha o tipo, usuario e noticia!"})
        }
        if(!tipos.includes(tipo)){
            return res.status(400).json({msg: "Tipo de reacao invalido"})
        }
        const usuario = await db.query("SELECT id, banido FROM usuarios WHERE id = $1", [usuario_id])
        if(!usuario.rowCount){
            return res.status(404).json({msg: "Usuario nao encontrado"})
        }
        if(usuario.rows[0].banido){
            return res.status(403).json({msg: "Usuario banido nao pode reagir"})
        }
        const noticia = await db.query("SELECT id FROM noticias WHERE id = $1", [noticia_id])
        if(!noticia.rowCount){
            return res.status(404).json({msg: "Noticia nao encontrada"})
        }
        const r = await db.query("INSERT INTO reacoesnoticias (tipo, usuario_id, noticia_id) VALUES ($1, $2, $3) RETURNING *", [tipo, usuario_id, noticia_id])
        res.status(201).json(r.rows[0])
    }
    catch(err){
        if(err.code === "23505"){
            return res.status(409).json({msg: "Esse usuario ja reagiu a essa noticia"})
        }
        res.status(400).json({msg: err.message})
    }
})

router.put("/usuario/:usuario_id/noticia/:noticia_id", async (req, res) =>{
    try{
        const { usuario_id, noticia_id } = req.params
        const { tipo } = req.body
        const tipos = ["curtida", "fogo", "caveira", "risada"]
        if(!tipos.includes(tipo)){
            return res.status(400).json({msg: "Tipo de reacao invalido"})
        }
        const r = await db.query("INSERT INTO reacoesnoticias (tipo, usuario_id, noticia_id) VALUES ($1, $2, $3) ON CONFLICT (usuario_id, noticia_id) DO UPDATE SET tipo = EXCLUDED.tipo RETURNING *", [tipo, usuario_id, noticia_id])
        res.status(200).json(r.rows[0])
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.put("/:id", async (req, res) =>{
    try{
        const id = req.params.id
        const { tipo } = req.body
        const tipos = ["curtida", "fogo", "caveira", "risada"]
        if(!tipos.includes(tipo)){
            return res.status(400).json({msg: "Tipo de reacao invalido"})
        }
        const r = await db.query("UPDATE reacoesnoticias SET tipo = $1 WHERE id = $2 RETURNING *", [tipo, id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Reacao nao encontrada"})
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
        const r = await db.query("DELETE FROM reacoesnoticias WHERE id = $1 RETURNING *", [id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Reacao nao encontrada"})
        }
        res.status(200).json({msg: "Reacao excluida com sucesso", reacao: r.rows[0]})
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

module.exports = router
