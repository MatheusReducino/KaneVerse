const express = require("express");
const router = express.Router();
const db = require("../db");
const { idValido, textoValido, emailValido, senhaValida } = require("../middlewares/validacoes");
const bcrypt = require("bcrypt");
const { verificarToken, verificarAdmin, podeAlterar } = require("../middlewares/auth");
const { upload, imagemValida } = require("../middlewares/imagem");
const campos = "id, nome_usuario, email, descricao, banido, kane_points, cargo, data_cadastro";

router.get("/", async (req, res)=>{
    try{
        const r = await db.query("SELECT id, nome_usuario, descricao, kane_points, cargo, data_cadastro FROM usuarios ORDER BY id");
        return res.status(200).json(r.rows);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})

router.get("/:id/pfp", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const r = await db.query("SELECT pfp, pfp_tipo FROM usuarios WHERE id=$1", [req.params.id]);
        if (!r.rowCount || !r.rows[0].pfp){
            return res.status(404).json({ msg: "Foto nao encontrada" })
        }
        res.type(r.rows[0].pfp_tipo || "image/jpeg");
        return res.send(r.rows[0].pfp);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})

router.get("/:id/titulos", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const u = await db.query("SELECT id FROM usuarios WHERE id=$1", [req.params.id]);
        if (!u.rowCount){
            return res.status(404).json({ msg: "Usuario nao encontrado" })
        }
        const r = await db.query("SELECT t.*, ut.data_desbloqueio FROM usuario_titulo ut JOIN titulos t ON t.id=ut.titulo_id WHERE ut.usuario_id=$1 ORDER BY ut.data_desbloqueio", [req.params.id]);
        return res.status(200).json(r.rows);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})

router.get("/:id", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const r = await db.query("SELECT id, nome_usuario, descricao, kane_points, cargo, data_cadastro FROM usuarios WHERE id=$1", [req.params.id]);
        if (!r.rowCount){
            return res.status(404).json({ msg: "Usuario nao encontrado" })
        }
        return res.status(200).json(r.rows[0]);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})

router.post("/", async (req, res)=>{
    try{
        const { nome_usuario, email, senha, descricao } = req.body || {};
        if (!textoValido(nome_usuario, 50, 3) || !emailValido(email) || !senhaValida(senha)){
            return res.status(400).json({ msg: "Informe nome (3 a 50), email valido e senha (8 a 72 bytes)" })
        }
        if (descricao != null && (typeof descricao !== "string" || descricao.length > 500)){
            return res.status(400).json({ msg: "Descricao invalida" })
        }
        const existe = await db.query("SELECT id FROM usuarios WHERE nome_usuario=$1 OR email=$2", [nome_usuario.trim(), email.trim().toLowerCase()]);
        if (existe.rowCount){
            return res.status(409).json({ msg: "Nome ou email ja existe" })
        }
        const hash = await bcrypt.hash(senha, 12);
        const r = await db.query(`INSERT INTO usuarios (nome_usuario, email, senha_hash, descricao) VALUES ($1,$2,$3,$4) RETURNING ${campos}`, [nome_usuario.trim(), email.trim().toLowerCase(), hash, descricao || null]);
        return res.status(201).json(r.rows[0]);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})

router.use(verificarToken);

router.put("/:id", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const id = req.params.id;
        if (!podeAlterar(req.usuario, id)){
            return res.status(403).json({ msg: "Voce so pode editar sua conta" })
        }
        const { nome_usuario, email, senha, descricao } = req.body || {};
        if (!textoValido(nome_usuario, 50, 3) || !emailValido(email)){
            return res.status(400).json({ msg: "Nome e email obrigatorios" })
        }
        if (senha != null && (!senhaValida(senha))){
            return res.status(400).json({ msg: "Senha precisa ter 8 caracteres e no maximo 72 bytes" })
        }
        if (descricao != null && (typeof descricao !== "string" || descricao.length > 500)){
            return res.status(400).json({ msg: "Descricao invalida" })
        }
        const existe = await db.query("SELECT id FROM usuarios WHERE (nome_usuario=$1 OR email=$2) AND id<>$3", [nome_usuario.trim(), email.trim().toLowerCase(), id]);
        if (existe.rowCount){
            return res.status(409).json({ msg: "Outro usuario ja usa esse nome ou email" })
        }
        const hash = senha ? await bcrypt.hash(senha, 12) : null;
        const r = await db.query(`UPDATE usuarios SET nome_usuario=$1, email=$2, senha_hash=COALESCE($3, senha_hash), descricao=$4 WHERE id=$5 RETURNING ${campos}`, [nome_usuario.trim(), email.trim().toLowerCase(), hash, descricao || null, id]);
        if (!r.rowCount){
            return res.status(404).json({ msg: "Usuario nao encontrado" })
        }
        return res.status(200).json(r.rows[0]);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})

router.put("/:id/pfp", upload.single("imagem"), async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        if (!podeAlterar(req.usuario, req.params.id)){
            return res.status(403).json({ msg: "Sem permissao" })
        }
        if (!imagemValida(req.file)){
            return res.status(400).json({ msg: "Envie PNG, JPG ou WEBP (ate 3 MB) no campo imagem" })
        }
        const r = await db.query("UPDATE usuarios SET pfp=$1, pfp_tipo=$2 WHERE id=$3 RETURNING id", [req.file.buffer, req.file.mimetype, req.params.id]);
        if (!r.rowCount){
            return res.status(404).json({ msg: "Usuario nao encontrado" })
        }
        return res.status(200).json({ msg: "Foto atualizada", url: `/usuarios/${req.params.id}/pfp` })
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})

router.delete("/:id/pfp", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        if (!podeAlterar(req.usuario, req.params.id)){
            return res.status(403).json({ msg: "Sem permissao" })
        }
        const r = await db.query("UPDATE usuarios SET pfp=NULL, pfp_tipo=NULL WHERE id=$1 RETURNING id", [req.params.id]);
        if (!r.rowCount){
            return res.status(404).json({ msg: "Usuario nao encontrado" })
        }
        return res.status(200).json({ msg: "Foto removida" })
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})

router.delete("/:id", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        if (!podeAlterar(req.usuario, req.params.id)){
            return res.status(403).json({ msg: "Sem permissao" })
        }
        const alvo = await db.query("SELECT cargo FROM usuarios WHERE id=$1", [req.params.id]);
        if (!alvo.rowCount){
            return res.status(404).json({ msg: "Usuario nao encontrado" })
        }
        if (alvo.rows[0].cargo === "admin"){
            return res.status(403).json({ msg: "Rebaixe o cargo antes de excluir um administrador" })
        }
        const r = await db.query("DELETE FROM usuarios WHERE id=$1 RETURNING id, nome_usuario", [req.params.id]);
        if (!r.rowCount){
            return res.status(404).json({ msg: "Usuario nao encontrado" })
        }
        return res.status(200).json({ msg: "Usuario excluido", usuario: r.rows[0] })
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})

router.put("/:id/cargo", verificarAdmin, async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const { cargo } = req.body || {};
        if (cargo !== "user" && cargo !== "admin"){
            return res.status(400).json({ msg: "Cargo deve ser user ou admin" })
        }
        if (Number(req.params.id) === req.usuario.id && cargo === "user"){
            return res.status(403).json({ msg: "Nao remova o seu proprio cargo de admin" })
        }
        const r = await db.query("UPDATE usuarios SET cargo=$1 WHERE id=$2 RETURNING id, nome_usuario, cargo", [cargo, req.params.id]);
        if (!r.rowCount){
            return res.status(404).json({ msg: "Usuario nao encontrado" })
        }
        return res.status(200).json(r.rows[0]);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})

router.put("/:id/pontos", verificarAdmin, async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const { quantidade } = req.body || {};
        if (!Number.isInteger(quantidade) || quantidade < -10000 || quantidade > 10000){
            return res.status(400).json({ msg: "Informe quantidade inteira entre -10000 e 10000" })
        }
        const r = await db.query("UPDATE usuarios SET kane_points=kane_points+$1 WHERE id=$2 AND kane_points+$1>=0 RETURNING id, kane_points", [quantidade, req.params.id]);
        if (!r.rowCount){
            const usuario = await db.query("SELECT id FROM usuarios WHERE id=$1", [req.params.id]);
            if (!usuario.rowCount){
                return res.status(404).json({ msg: "Usuario nao encontrado" })
            }
            return res.status(400).json({ msg: "Saldo insuficiente" })
        }
        return res.status(200).json(r.rows[0]);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})

module.exports = router;
