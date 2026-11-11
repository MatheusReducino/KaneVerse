
const express = require("express")
const router = express.Router()
const db = require("../db")


router.get("/", async (req, res) =>{
    try{
        const r = await db.query("SELECT * FROM titulos ORDER BY kane_points_desbloqueio ASC")
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})


router.get("/:id", async (req, res) =>{
    try{
        const id = req.params.id
        const r = await db.query("SELECT * FROM titulos WHERE id = $1", [id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Titulo nao encontrado"})
        }
        res.status(200).json(r.rows[0])
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/:id/usuarios", async (req, res) =>{
    try{
        const id = req.params.id
        const r = await db.query("SELECT u.id, u.nome_usuario, ut.data_desbloqueio FROM usuario_titulo ut INNER JOIN usuarios u ON ut.usuario_id = u.id WHERE ut.titulo_id = $1 ORDER BY ut.data_desbloqueio DESC", [id])
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.post("/", async (req, res) =>{
    try{
        const { nome_titulo, descricao, kane_points_desbloqueio } = req.body
        if(!nome_titulo || kane_points_desbloqueio === undefined || kane_points_desbloqueio === null){
            return res.status(400).json({msg: "Preencha o nome e o custo em Kane Points!"})
        }
        if(Number(kane_points_desbloqueio) < 0 || !Number.isInteger(Number(kane_points_desbloqueio))){
            return res.status(400).json({msg: "O custo deve ser um numero inteiro positivo ou zero"})
        }
        const r = await db.query("INSERT INTO titulos (nome_titulo, descricao, kane_points_desbloqueio) VALUES ($1, $2, $3) RETURNING *", [nome_titulo, descricao || null, kane_points_desbloqueio])
        res.status(201).json(r.rows[0])
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.put("/:id", async (req, res) =>{
    try{
        const id = req.params.id
        const { nome_titulo, descricao, kane_points_desbloqueio } = req.body
        if(!nome_titulo || kane_points_desbloqueio === undefined || kane_points_desbloqueio === null){
            return res.status(400).json({msg: "Preencha o nome e o custo em Kane Points!"})
        }
        if(Number(kane_points_desbloqueio) < 0 || !Number.isInteger(Number(kane_points_desbloqueio))){
            return res.status(400).json({msg: "O custo deve ser um numero inteiro positivo ou zero"})
        }
        const r = await db.query("UPDATE titulos SET nome_titulo = $1, descricao = $2, kane_points_desbloqueio = $3 WHERE id = $4 RETURNING *", [nome_titulo, descricao || null, kane_points_desbloqueio, id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Titulo nao encontrado"})
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
        const r = await db.query("DELETE FROM titulos WHERE id = $1 RETURNING *", [id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Titulo nao encontrado"})
        }
        res.status(200).json({msg: "Titulo excluido com sucesso", titulo: r.rows[0]})
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

module.exports = router
