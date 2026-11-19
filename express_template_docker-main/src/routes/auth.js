const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { verificarToken } = require("../middlewares/auth");
const { emailValido } = require("../middlewares/validacoes");

router.post("/login", async (req, res)=>{
    try{
        const { email, senha } = req.body || {};
        if (!emailValido(email) || typeof senha !== "string" || !senha){
            return res.status(400).json({ msg: "Informe email valido e senha" })
        }
        const r = await db.query("SELECT * FROM usuarios WHERE email=$1", [email.trim().toLowerCase()]);
        if (!r.rowCount){
            return res.status(401).json({ msg: "Email ou senha incorretos" })
        }
        const usuario = r.rows[0];
        const correta = await bcrypt.compare(senha, usuario.senha_hash);
        if (!correta){
            return res.status(401).json({ msg: "Email ou senha incorretos" })
        }
        if (usuario.banido){
            return res.status(403).json({ msg: "Conta banida" })
        }
        const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: "2h" })
        return res.status(200).json({ msg: "Login realizado", token, usuario: { id: usuario.id, nome_usuario: usuario.nome_usuario, cargo: usuario.cargo } })
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})

router.get("/me", verificarToken, (req, res)=>{
    return res.status(200).json(req.usuario)
})

module.exports = router;
