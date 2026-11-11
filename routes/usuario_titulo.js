const express = require("express")
const router = express.Router()
const db = require("../db")

router.get("/", async (req, res) =>{
    try{
        const r = await db.query("SELECT ut.usuario_id, u.nome_usuario, ut.titulo_id, t.nome_titulo, t.descricao, ut.data_desbloqueio FROM usuario_titulo ut INNER JOIN usuarios u ON ut.usuario_id = u.id INNER JOIN titulos t ON ut.titulo_id = t.id ORDER BY ut.data_desbloqueio DESC")
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/usuario/:id", async (req, res) =>{
    try{
        const id = req.params.id
        const r = await db.query("SELECT t.id, t.nome_titulo, t.descricao, t.kane_points_desbloqueio, ut.data_desbloqueio FROM usuario_titulo ut INNER JOIN titulos t ON ut.titulo_id = t.id WHERE ut.usuario_id = $1 ORDER BY ut.data_desbloqueio DESC", [id])
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/disponiveis/:id", async (req, res) =>{
    try{
        const id = req.params.id
        const r = await db.query("SELECT t.id, t.nome_titulo, t.descricao, t.kane_points_desbloqueio, u.kane_points FROM titulos t CROSS JOIN usuarios u WHERE u.id = $1 AND NOT EXISTS (SELECT 1 FROM usuario_titulo ut WHERE ut.usuario_id = u.id AND ut.titulo_id = t.id) ORDER BY t.kane_points_desbloqueio ASC", [id])
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.post("/", async (req, res) =>{
    const { usuario_id, titulo_id } = req.body
    if(!usuario_id || !titulo_id){
        return res.status(400).json({msg: "Informe o usuario e o titulo!"})
    }
    try{
        const r = await db.transaction(async (conexao) =>{
            const usuario = await conexao.query("SELECT id, kane_points FROM usuarios WHERE id = $1 FOR UPDATE", [usuario_id])
            if(!usuario.rowCount){
                throw new Error("Usuario nao encontrado")
            }
            const titulo = await conexao.query("SELECT id, nome_titulo, kane_points_desbloqueio FROM titulos WHERE id = $1", [titulo_id])
            if(!titulo.rowCount){
                throw new Error("Titulo nao encontrado")
            }
            const custo = titulo.rows[0].kane_points_desbloqueio
            if(usuario.rows[0].kane_points < custo){
                throw new Error("Kane Points insuficientes")
            }
            const existente = await conexao.query("SELECT * FROM usuario_titulo WHERE usuario_id = $1 AND titulo_id = $2", [usuario_id, titulo_id])
            if(existente.rowCount){
                throw new Error("Usuario ja possui esse titulo")
            }
            await conexao.query("UPDATE usuarios SET kane_points = kane_points - $1 WHERE id = $2", [custo, usuario_id])
            const desbloqueio = await conexao.query("INSERT INTO usuario_titulo (usuario_id, titulo_id) VALUES ($1, $2) RETURNING *", [usuario_id, titulo_id])
            return desbloqueio.rows[0]
        })
        res.status(201).json({msg: "Titulo desbloqueado com sucesso", desbloqueio: r})
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.delete("/:usuario_id/:titulo_id", async (req, res) =>{
    try{
        const { usuario_id, titulo_id } = req.params
        const r = await db.query("DELETE FROM usuario_titulo WHERE usuario_id = $1 AND titulo_id = $2 RETURNING *", [usuario_id, titulo_id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Titulo nao encontrado para esse usuario"})
        }
        res.status(200).json({msg: "Titulo removido com sucesso", titulo: r.rows[0]})
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

module.exports = router
