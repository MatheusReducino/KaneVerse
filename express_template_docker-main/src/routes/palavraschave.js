const express = require("express");
const router = express.Router();
const db = require("../db");
const { idValido, textoValido } = require("../middlewares/validacoes");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");

router.get("/", async (req, res)=>{
    try{
        const r = await db.query("SELECT * FROM palavraschave ORDER BY palavra");
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

        const r = await db.query("SELECT * FROM palavraschave WHERE id=$1", [req.params.id]);
        if (!r.rowCount){
            return res.status(404).json({ msg: "Palavra nao encontrada" })
        }
        return res.status(200).json(r.rows[0]);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.use(verificarToken, verificarAdmin);
router.post("/", async (req, res)=>{
    try{
        const { palavra } = req.body || {};
        if (!textoValido(palavra, 50)){
            return res.status(400).json({ msg: "palavra invalido (maximo 50 caracteres)" })
        }
        if (typeof palavra !== "string" || !palavra.trim()){
            return res.status(400).json({ msg: "Informe a palavra" })
        }
        const existe = await db.query("SELECT id FROM palavraschave WHERE palavra=$1", [palavra.trim()]);
        if (existe.rowCount){
            return res.status(409).json({ msg: "Palavra ja existe" })
        }
        const r = await db.query("INSERT INTO palavraschave (palavra) VALUES ($1) RETURNING *", [palavra.trim()]);
        return res.status(201).json(r.rows[0]);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.put("/:id", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const { palavra } = req.body || {};
        if (!textoValido(palavra, 50)){
            return res.status(400).json({ msg: "palavra invalido (maximo 50 caracteres)" })
        }
        if (typeof palavra !== "string" || !palavra.trim()){
            return res.status(400).json({ msg: "Informe a palavra" })
        }
        const existe = await db.query("SELECT id FROM palavraschave WHERE palavra=$1 AND id<>$2", [palavra.trim(), req.params.id]);
        if (existe.rowCount){
            return res.status(409).json({ msg: "Outra palavra igual ja existe" })
        }
        const r = await db.query("UPDATE palavraschave SET palavra=$1 WHERE id=$2 RETURNING *", [palavra.trim(), req.params.id]);
        if (!r.rowCount){
            return res.status(404).json({ msg: "Palavra nao encontrada" })
        }
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

        const r = await db.query("DELETE FROM palavraschave WHERE id=$1 RETURNING *", [req.params.id]);
        if (!r.rowCount){
            return res.status(404).json({ msg: "Palavra nao encontrada" })
        }
        return res.status(200).json({ msg: "Palavra removida", palavra: r.rows[0] })
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
module.exports = router;
