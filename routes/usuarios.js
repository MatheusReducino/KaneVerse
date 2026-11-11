const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");



router.get("/", async (req, res) =>{
    try{
        const r = await db.query("SELECT id, nome_usuario, email, descricao, banido, kane_points, cargo, data_cadastro FROM usuarios")
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/:id", async (req, res) =>{
    try{
        const id = req.params.id;
        const r = await db.query("SELECT id, nome_usuario, email, descricao, banido, kane_points, cargo, data_cadastro FROM usuarios WHERE id = $1", [id])

        if(!r.rowCount){
            return res.status(404).json({msg: "usuario nao encontrado"})
        }

        res.status(200).json(r.rows[0])
    }
    catch(err){
        return res.status(400).json({msg: err.message})
    }
})


router.post("/", async (req, res) =>{
    try {
        const { nome_usuario, email, senha, descricao } = req.body;

        if (!nome_usuario || !email || !senha){
            return res.status(400).json({msg: "Preencha nome de usuário, email e senha!"})
        }
        const existe = await db.query(
            "SELECT id FROM usuarios WHERE nome_usuario = $1 OR email = $2",[nome_usuario, email]
        )
        if (existe.rowCount > 0){
            return res.status(409).json({msg: "Nome de usuário ou email já cadastrado!"})
        }
        const senha_hash = await bcrypt.hash(senha, 12)
        const r = await db.query(
            "INSERT INTO usuarios (nome_usuario, email, senha_hash, descricao) VALUES ($1, $2, $3, $4) RETURNING id, nome_usuario, email, descricao, banido, kane_points, cargo, data_cadastro", [nome_usuario, email, senha_hash, descricao || null]
        )
        res.status(201).json(r.rows[0])
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
});

router.put("/:id", async (req, res) =>{
    try{
        const id = req.params.id
        const { nome_usuario, email, senha, descricao } = req.body
        if (!nome_usuario || !email){
            return res.status(400).json({msg: "Preencha nome de usuário e email!"})
        }
        const existe = await db.query("SELECT id FROM usuarios WHERE (nome_usuario = $1 OR email = $2) AND id <> $3", [nome_usuario, email, id])

        if (existe.rowCount > 0){
            return res.status(409).json({msg: "Nome de usuário ou email já cadastrado!"})
        }
        let senha_hash = null
        if (senha){
            senha_hash = await bcrypt.hash(senha, 12)
        }
        const r = await db.query("UPDATE usuarios SET nome_usuario = $1, email = $2, senha_hash = COALESCE($3, senha_hash), descricao = $4 WHERE id = $5 RETURNING id, nome_usuario, email, descricao, banido, kane_points, cargo, data_cadastro", [nome_usuario, email, senha_hash, descricao || null, id])

        if (!r.rowCount){
            return res.status(404).json({msg: "Usuario nao encontrado"})
        }
        res.status(200).json(r.rows[0])
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.delete("/:id", async (req, res) => {
    try{
        const id = req.params.id
        const r = await db.query("DELETE FROM usuarios WHERE id = $1 RETURNING id, nome_usuario", [id])
        if (!r.rowCount){
            return res.status(404).json({msg: "Usuario nao encontrado"})
        }
        res.status(200).json({msg: "Usuario excluido com sucesso", usuario: r.rows[0]})
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

router.get("/:id/titulos", async (req, res) => {
    try{
        const id = req.params.id
        const usuario = await db.query("SELECT id FROM usuarios WHERE id = $1", [id])
        if (!usuario.rowCount){
            return res.status(404).json({msg: "Usuario nao encontrado"})
        }
        const r = await db.query("SELECT t.id, t.nome_titulo, t.descricao, t.kane_points_desbloqueio, ut.data_desbloqueio FROM usuario_titulo ut INNER JOIN titulos t ON ut.titulo_id = t.id WHERE ut.usuario_id = $1 ORDER BY ut.data_desbloqueio", [id])
        res.status(200).json(r.rows)
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})

module.exports = router;