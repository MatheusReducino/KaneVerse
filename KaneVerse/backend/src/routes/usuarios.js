const express = require("express");
const router = express.Router();
const db = require("../db");
const autenticaUsuario = require("../middlewares/autenticaUsuario");
const verificaId = require("../middlewares/verificaId");
const verificaAdmin = require("../middlewares/verificaAdmin");
const { upload, verificaImagem, enviaImagem } = require("../middlewares/upload");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.get("/", async (req,res)=>{
    try{
        const r = await db.query("SELECT id,nome_usuario,descricao,admin,banido,kane_points,data_cadastro,pfp IS NOT NULL AS tem_pfp FROM usuarios ORDER BY id")
        return res.status(200).json(r.rows)
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao listar usuarios"})
    }
})

router.get("/ranking", async (req,res)=>{
    try{
        const r = await db.query("SELECT id,nome_usuario,kane_points,pfp IS NOT NULL AS tem_pfp FROM usuarios WHERE banido=FALSE ORDER BY kane_points DESC,id LIMIT 10")
        return res.status(200).json(r.rows)
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar ranking"})
    }
})

router.get("/me", autenticaUsuario, async (req,res)=>{
    try{
        const r = await db.query("SELECT id,nome_usuario,email,descricao,admin,banido,kane_points,data_cadastro,pfp IS NOT NULL AS tem_pfp FROM usuarios WHERE id=$1", [req.usuario.id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Usuario nao encontrado"})
        }
        return res.status(200).json(r.rows[0])
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar perfil"})
    }
})

router.get("/:id/pfp", verificaId, async (req,res)=>{
    try{
        const r = await db.query("SELECT pfp FROM usuarios WHERE id=$1", [req.id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Usuario nao encontrado"})
        }
        return enviaImagem(res, r.rows[0].pfp)
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar foto"})
    }
})

router.get("/:id", verificaId, async (req,res)=>{
    try{
        const r = await db.query("SELECT id,nome_usuario,descricao,admin,banido,kane_points,data_cadastro,pfp IS NOT NULL AS tem_pfp FROM usuarios WHERE id=$1", [req.id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Usuario nao encontrado"})
        }
        return res.status(200).json(r.rows[0])
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar usuario"})
    }
})

router.post("/", async (req,res)=>{
    try{
        let { nome_usuario, email, senha, descricao } = req.body || {};
        if(typeof nome_usuario !== "string" || !nome_usuario.trim() || nome_usuario.length > 255){
            return res.status(400).json({msg: "Nome de usuario invalido"})
        }
        if(typeof email !== "string" || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){
            return res.status(400).json({msg: "Email invalido"})
        }
        if(typeof senha !== "string" || !senha.trim() || senha.length < 8 || Buffer.byteLength(senha, "utf8") > 72){
            return res.status(400).json({msg: "Senha deve ter ao menos 8 caracteres e no maximo 72 bytes"})
        }
        if(descricao == null){
            descricao = null;
        } else if(typeof descricao !== "string" || descricao.length > 500){
            return res.status(400).json({msg: "Descricao invalida"})
        }
        nome_usuario = nome_usuario.trim();
        email = email.trim().toLowerCase();
        const r1 = await db.query("SELECT id FROM usuarios WHERE nome_usuario=$1", [nome_usuario])
        if(r1.rowCount){
            return res.status(409).json({msg: "Nome de usuario ja cadastrado"})
        }
        const r2 = await db.query("SELECT id FROM usuarios WHERE email=$1", [email])
        if(r2.rowCount){
            return res.status(409).json({msg: "Email ja cadastrado"})
        }
        const senha_hash = await bcrypt.hash(senha, 12);
        const r3 = await db.query("INSERT INTO usuarios (nome_usuario,email,senha_hash,descricao) VALUES ($1,$2,$3,$4) RETURNING id,nome_usuario,email,descricao,kane_points,admin,banido", [nome_usuario, email, senha_hash, descricao])
        if(!r3.rowCount){
            throw new Error("Usuario nao cadastrado")
        }
        return res.status(201).json({msg: "Usuario cadastrado com sucesso", usuario: r3.rows[0]})
    } catch (error){
        if(error.code === "23505"){
            return res.status(409).json({msg: "Usuario ou email ja cadastrado"})
        }
        console.error(error)
        return res.status(500).json({msg: "Erro ao cadastrar usuario"})
    }
})

router.post("/login", async (req,res)=>{
    try{
        let { email, senha } = req.body || {};
        if(typeof email !== "string" || !email.trim() || email.length > 255){
            return res.status(400).json({msg: "Email invalido"})
        }
        if(typeof senha !== "string" || !senha.trim() || Buffer.byteLength(senha, "utf8") > 72){
            return res.status(400).json({msg: "Senha invalida"})
        }
        email = email.trim().toLowerCase();
        const r = await db.query("SELECT id,nome_usuario,email,senha_hash,admin,banido,kane_points,descricao,pfp IS NOT NULL AS tem_pfp FROM usuarios WHERE email=$1", [email])
        if(!r.rowCount){
            return res.status(401).json({msg: "Email ou senha incorretos"})
        }
        const usuario = r.rows[0];
        const senha_hash = usuario.senha_hash.trim();
        if(!/^\$2[ab]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(senha_hash) || !await bcrypt.compare(senha, senha_hash)){
            return res.status(401).json({msg: "Email ou senha incorretos"})
        }
        if(usuario.banido){
            return res.status(403).json({msg: "Usuario banido"})
        }
        const token = jwt.sign({id: usuario.id}, process.env.JWT_SECRET, {expiresIn: "24h", algorithm: "HS256"})
        delete usuario.senha_hash;
        return res.status(200).json({msg: "Login realizado com sucesso", token, usuario})
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao realizar login"})
    }
})

router.put("/me", autenticaUsuario, async (req,res)=>{
    try{
        let { nome_usuario, email, descricao } = req.body || {};
        if(typeof nome_usuario !== "string" || !nome_usuario.trim() || nome_usuario.length > 255){
            return res.status(400).json({msg: "Nome de usuario invalido"})
        }
        if(typeof email !== "string" || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){
            return res.status(400).json({msg: "Email invalido"})
        }
        if(descricao == null){
            descricao = null;
        } else if(typeof descricao !== "string" || descricao.length > 500){
            return res.status(400).json({msg: "Descricao invalida"})
        }
        nome_usuario = nome_usuario.trim();
        email = email.trim().toLowerCase();
        const r1 = await db.query("SELECT id FROM usuarios WHERE nome_usuario=$1 AND id<>$2", [nome_usuario, req.usuario.id])
        if(r1.rowCount){
            return res.status(409).json({msg: "Nome de usuario ja cadastrado"})
        }
        const r2 = await db.query("SELECT id FROM usuarios WHERE email=$1 AND id<>$2", [email, req.usuario.id])
        if(r2.rowCount){
            return res.status(409).json({msg: "Email ja cadastrado"})
        }
        const r3 = await db.query("UPDATE usuarios SET nome_usuario=$1,email=$2,descricao=$3 WHERE id=$4 RETURNING id,nome_usuario,email,descricao,kane_points,admin,banido,pfp IS NOT NULL AS tem_pfp", [nome_usuario, email, descricao, req.usuario.id])
        if(!r3.rowCount){
            return res.status(404).json({msg: "Usuario nao encontrado"})
        }
        return res.status(200).json({msg: "Perfil atualizado", usuario: r3.rows[0]})
    } catch (error){
        if(error.code === "23505"){
            return res.status(409).json({msg: "Usuario ou email ja cadastrado"})
        }
        console.error(error)
        return res.status(500).json({msg: "Erro ao atualizar perfil"})
    }
})

router.put("/me/pfp", autenticaUsuario, upload.single("pfp"), verificaImagem, async (req,res)=>{
    try{
        const r = await db.query("UPDATE usuarios SET pfp=$1 WHERE id=$2", [req.file.buffer, req.usuario.id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Usuario nao encontrado"})
        }
        return res.status(200).json({msg: "Foto de perfil atualizada"})
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao salvar foto"})
    }
})

router.delete("/me/pfp", autenticaUsuario, async (req,res)=>{
    try{
        const r = await db.query("UPDATE usuarios SET pfp=NULL WHERE id=$1", [req.usuario.id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Usuario nao encontrado"})
        }
        return res.status(200).json({msg: "Foto removida"})
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao remover foto"})
    }
})

router.put("/:id/points", autenticaUsuario, verificaAdmin, verificaId, async (req,res)=>{
    try{
        const { kane_points } = req.body || {};
        if(!Number.isInteger(kane_points)){
            return res.status(400).json({msg: "Kane Points devem ser um numero inteiro"})
        }
        if(kane_points < 0 || kane_points > 2147483647){
            return res.status(400).json({msg: "Quantidade de Kane Points invalida"})
        }
        const r = await db.query("UPDATE usuarios SET kane_points=$1 WHERE id=$2 RETURNING id,kane_points", [kane_points, req.id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Usuario nao encontrado"})
        }
        return res.status(200).json({msg: "Kane Points atualizados", usuario: r.rows[0]})
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao atualizar pontos"})
    }
})

router.delete("/:id", autenticaUsuario, verificaId, async (req,res)=>{
    try{
        if(req.usuario.id !== req.id && !req.usuario.admin){
            return res.status(403).json({msg: "Voce nao pode excluir esse usuario"})
        }
        const r1 = await db.query("SELECT admin FROM usuarios WHERE id=$1", [req.id])
        if(!r1.rowCount){
            return res.status(404).json({msg: "Usuario nao encontrado"})
        }
        if(r1.rows[0].admin){
            return res.status(403).json({msg: "Nao e permitido excluir administradores por esta rota"})
        }
        const r2 = await db.query("DELETE FROM usuarios WHERE id=$1 AND admin=FALSE", [req.id])
        if(!r2.rowCount){
            return res.status(404).json({msg: "Usuario nao encontrado ou protegido"})
        }
        return res.status(200).json({msg: "Usuario excluido"})
    } catch (error){
        if(error.code === "23503"){
            return res.status(409).json({msg: "Usuario possui historico de banimentos e nao pode ser excluido"})
        }
        console.error(error)
        return res.status(500).json({msg: "Erro ao excluir usuario"})
    }
})

module.exports = router;
