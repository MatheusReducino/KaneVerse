
const express = require("express")
const router = express.Router()
const db = require("../db")


router.get("/", async (req, res) =>{
    try{
        const r = await db.query("SELECT b.id, b.usuario_id, u.nome_usuario AS usuario, b.administrador_id, a.nome_usuario AS administrador, b.motivo, b.data_banimento, b.ativo FROM banimentos b INNER JOIN usuarios u ON b.usuario_id = u.id INNER JOIN usuarios a ON b.administrador_id = a.id ORDER BY b.data_banimento DESC")
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/:id", async (req, res) =>{
    try{
        const id = req.params.id
        const r = await db.query("SELECT b.id, b.usuario_id, u.nome_usuario AS usuario, b.administrador_id, a.nome_usuario AS administrador, b.motivo, b.data_banimento, b.ativo FROM banimentos b INNER JOIN usuarios u ON b.usuario_id = u.id INNER JOIN usuarios a ON b.administrador_id = a.id WHERE b.id = $1", [id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Banimento nao encontrado"})
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
        const r = await db.query("SELECT b.id, b.motivo, b.data_banimento, b.ativo, a.nome_usuario AS administrador FROM banimentos b INNER JOIN usuarios a ON b.administrador_id = a.id WHERE b.usuario_id = $1 ORDER BY b.data_banimento DESC", [id])
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.post("/", async (req, res) =>{
    try{
        const { usuario_id, administrador_id, motivo } = req.body
        if(!usuario_id || !administrador_id || !motivo){
            return res.status(400).json({msg: "Informe o usuario, administrador e motivo!"})
        }
        const administrador = await db.query("SELECT id, cargo FROM usuarios WHERE id = $1", [administrador_id])
        if(!administrador.rowCount){
            return res.status(404).json({msg: "Administrador nao encontrado"})
        }
        if(administrador.rows[0].cargo !== "admin"){
            return res.status(403).json({msg: "Apenas administradores podem banir usuarios"})
        }
        const usuario = await db.query("SELECT id FROM usuarios WHERE id = $1", [usuario_id])
        if(!usuario.rowCount){
            return res.status(404).json({msg: "Usuario nao encontrado"})
        }
        const ativo = await db.query("SELECT id FROM banimentos WHERE usuario_id = $1 AND ativo = true", [usuario_id])
        if(ativo.rowCount){
            return res.status(409).json({msg: "Usuario ja esta banido"})
        }
        const r = await db.transaction(async (conexao) =>{
            const banimento = await conexao.query("INSERT INTO banimentos (usuario_id, administrador_id, motivo, ativo) VALUES ($1, $2, $3, true) RETURNING *", [usuario_id, administrador_id, motivo])
            await conexao.query("UPDATE usuarios SET banido = true WHERE id = $1", [usuario_id])
            return banimento.rows[0]
        })
        res.status(201).json({msg: "Usuario banido com sucesso", banimento: r})
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.put("/:id/reativar", async (req, res) =>{
    try{
        const id = req.params.id
        const { administrador_id } = req.body
        if(!administrador_id){
            return res.status(400).json({msg: "Informe o ID do administrador!"})
        }
        const administrador = await db.query("SELECT id, cargo FROM usuarios WHERE id = $1", [administrador_id])
        if(!administrador.rowCount){
            return res.status(404).json({msg: "Administrador nao encontrado"})
        }
        if(administrador.rows[0].cargo !== "admin"){
            return res.status(403).json({msg: "Apenas administradores podem reativar usuarios"})
        }
        const r = await db.transaction(async (conexao) =>{
            const banimento = await conexao.query("UPDATE banimentos SET ativo = false WHERE id = $1 AND ativo = true RETURNING usuario_id", [id])
            if(!banimento.rowCount){
                throw new Error("Banimento ativo nao encontrado")
            }
            await conexao.query("UPDATE usuarios SET banido = false WHERE id = $1", [banimento.rows[0].usuario_id])
            return banimento.rows[0]
        })
        res.status(200).json({msg: "Usuario reativado com sucesso", usuario_id: r.usuario_id})
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

module.exports = router
