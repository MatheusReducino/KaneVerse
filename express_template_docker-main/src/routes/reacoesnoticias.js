const express = require("express");
const router = express.Router();
const db = require("../db");
const { idValido } = require("../middlewares/validacoes");
const { verificarToken, podeAlterar } = require("../middlewares/auth");
const tipos = ["curtida", "fogo", "caveira", "risada"];

router.get("/", async (req, res)=>{
    try{
        const r = await db.query("SELECT r.*, u.nome_usuario FROM reacoesnoticias r JOIN usuarios u ON r.usuario_id=u.id ORDER BY r.id DESC");
        return res.status(200).json(r.rows);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.get("/noticia/:id", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }
        const r = await db.query("SELECT r.*, u.nome_usuario FROM reacoesnoticias r JOIN usuarios u ON r.usuario_id=u.id WHERE r.noticia_id=$1", [req.params.id]);
        return res.status(200).json(r.rows);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.get("/resumo/:id", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }
        const r = await db.query("SELECT tipo, COUNT(*) AS quantidade FROM reacoesnoticias WHERE noticia_id=$1 GROUP BY tipo ORDER BY quantidade DESC", [req.params.id]);
        return res.status(200).json(r.rows);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.get("/usuario/:usuario_id/noticia/:noticia_id", async (req, res)=>{
    try{
        if (!idValido(req.params.usuario_id) || !idValido(req.params.noticia_id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const r = await db.query("SELECT * FROM reacoesnoticias WHERE usuario_id=$1 AND noticia_id=$2", [req.params.usuario_id, req.params.noticia_id]);
        if (!r.rowCount){
            return res.status(404).json({ msg: "Reacao nao encontrada" })
        }
        return res.status(200).json(r.rows[0]);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})

router.use(verificarToken);
router.post("/", async (req, res)=>{
    try{
        const { tipo, noticia_id } = req.body || {};
        if (!idValido(noticia_id)){
            return res.status(400).json({ msg: "noticia_id deve ser um inteiro positivo" })
        }
        if (!tipos.includes(tipo) || !noticia_id){
            return res.status(400).json({ msg: "Informe tipo valido e noticia_id" })
        }
        const alvo = await db.query("SELECT id FROM noticias WHERE id=$1", [noticia_id]);
        if (!alvo.rowCount){
            return res.status(404).json({ msg: "Conteudo nao encontrado" })
        }
        const existente = await db.query("SELECT id FROM reacoesnoticias WHERE usuario_id=$1 AND noticia_id=$2", [req.usuario.id, noticia_id]);
        if (existente.rowCount){
            return res.status(409).json({ msg: "Voce ja reagiu. Use PUT para mudar a reacao" })
        }
        const reacao = await db.transaction(async (conexao)=>{
            const r = await conexao.query("INSERT INTO reacoesnoticias (tipo, usuario_id, noticia_id) VALUES ($1,$2,$3) RETURNING *", [tipo, req.usuario.id, noticia_id]);
            await conexao.query("UPDATE usuarios SET kane_points=kane_points+1 WHERE id=$1", [req.usuario.id]);
            return r.rows[0];
        })
        return res.status(201).json({ msg: "Reacao criada (+1 Kane Point)", reacao })
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.put("/usuario/:usuario_id/noticia/:noticia_id", async (req, res)=>{
    try{
        if (!idValido(req.params.usuario_id) || !idValido(req.params.noticia_id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        if (Number(req.params.usuario_id) !== req.usuario.id){
            return res.status(403).json({ msg: "So pode reagir pela sua conta" })
        }
        const { tipo } = req.body || {};
        if (!tipos.includes(tipo)){
            return res.status(400).json({ msg: "Tipo invalido" })
        }
        const r = await db.query("UPDATE reacoesnoticias SET tipo=$1 WHERE usuario_id=$2 AND noticia_id=$3 RETURNING *", [tipo, req.usuario.id, req.params.noticia_id]);
        if (!r.rowCount){
            return res.status(404).json({ msg: "Reacao nao existe. Use POST primeiro" })
        }
        return res.status(200).json(r.rows[0]);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.put("/:id", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const { tipo } = req.body || {};
        if (!tipos.includes(tipo)){
            return res.status(400).json({ msg: "Tipo invalido" })
        }
        const dono = await db.query("SELECT usuario_id FROM reacoesnoticias WHERE id=$1", [req.params.id]);
        if (!dono.rowCount){
            return res.status(404).json({ msg: "Reacao nao encontrada" })
        }
        if (!podeAlterar(req.usuario, dono.rows[0].usuario_id)){
            return res.status(403).json({ msg: "Sem permissao" })
        }
        const r = await db.query("UPDATE reacoesnoticias SET tipo=$1 WHERE id=$2 RETURNING *", [tipo, req.params.id]);
        return res.status(200).json(r.rows[0]);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.delete("/:id", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const dono = await db.query("SELECT usuario_id FROM reacoesnoticias WHERE id=$1", [req.params.id]);
        if (!dono.rowCount){
            return res.status(404).json({ msg: "Reacao nao encontrada" })
        }
        if (!podeAlterar(req.usuario, dono.rows[0].usuario_id)){
            return res.status(403).json({ msg: "Sem permissao" })
        }
        const r = await db.query("DELETE FROM reacoesnoticias WHERE id=$1 RETURNING id", [req.params.id]);
        return res.status(200).json({ msg: "Reacao excluida", reacao: r.rows[0] })
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
module.exports = router;
