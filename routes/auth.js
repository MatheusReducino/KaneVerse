
const express = require("express")
const router = express.Router()
const db = require("../db")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

router.post("/login", async (req, res) =>{
    try{
        const { email, senha } = req.body
        if(!email || !senha){
            return res.status(400).json({msg: "Informe o email e a senha!"})
        }
        const r = await db.query("SELECT id, nome_usuario, email, senha_hash, cargo, banido FROM usuarios WHERE email = $1", [email])
        if(!r.rowCount){
            return res.status(401).json({msg: "Email ou senha incorretos"})
        }
        const usuario = r.rows[0]
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash)
        if(!senhaCorreta){
            return res.status(401).json({msg: "Email ou senha incorretos"})
        }
        if(usuario.banido){
            return res.status(403).json({msg: "Sua conta esta banida"})
        }
        const token = jwt.sign(
            { id: usuario.id, cargo: usuario.cargo },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        )
        res.status(200).json({
            msg: "Login realizado com sucesso",
            token,
            usuario: {
                id: usuario.id,
                nome_usuario: usuario.nome_usuario,
                email: usuario.email,
                cargo: usuario.cargo
            }
        })
    }
    catch(err){
        res.status(400).json({msg: err.message})
    }
})
module.exports = router
