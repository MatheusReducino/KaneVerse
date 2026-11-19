const express = require("express");
const router = express.Router();
const db = require("../db");
const { idValido, textoValido } = require("../middlewares/validacoes");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");

router.use(verificarToken, verificarAdmin);
const lista = "SELECT b.id, b.usuario_id, u.nome_usuario AS usuario, b.administrador_id, a.nome_usuario AS administrador, b.motivo, b.data_banimento, b.ativo FROM banimentos b JOIN usuarios u ON u.id=b.usuario_id JOIN usuarios a ON a.id=b.administrador_id";
router.get("/", async (req, res)=>{
    try{
        const r = await db.query(lista + " ORDER BY b.data_banimento DESC");
        return res.status(200).json(r.rows);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.get("/usuario/:id", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }
        const r = await db.query(lista + " WHERE b.usuario_id=$1 ORDER BY b.data_banimento DESC", [req.params.id]);
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

        const r = await db.query(lista + " WHERE b.id=$1", [req.params.id]);
        if (!r.rowCount){
            return res.status(404).json({ msg: "Banimento nao encontrado" })
        }
        return res.status(200).json(r.rows[0]);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.post("/", async (req, res)=>{
    try{
        const { usuario_id, motivo } = req.body || {};
        if (!textoValido(motivo, 500)){
            return res.status(400).json({ msg: "motivo invalido (maximo 500 caracteres)" })
        }
        if (!idValido(usuario_id)){
            return res.status(400).json({ msg: "usuario_id deve ser um inteiro positivo" })
        }
        if (!usuario_id || typeof motivo !== "string" || !motivo.trim()){
            return res.status(400).json({ msg: "Informe usuario_id e motivo" })
        }
        if (Number(usuario_id) === req.usuario.id){
            return res.status(403).json({ msg: "Voce nao pode banir a si mesmo" })
        }
        const registro = await db.transaction(async (conexao)=>{
            const usuario = await conexao.query("SELECT id, cargo, banido FROM usuarios WHERE id=$1 FOR UPDATE", [usuario_id]);
            if (!usuario.rowCount){
                throw new Error("Usuario nao encontrado")
            }
            if (usuario.rows[0].cargo === "admin"){
                throw new Error("Nao e permitido banir administradores")
            }
            if (usuario.rows[0].banido){
                throw new Error("Usuario ja esta banido")
            }
            const r = await conexao.query("INSERT INTO banimentos (usuario_id, administrador_id, motivo) VALUES ($1,$2,$3) RETURNING *", [usuario_id, req.usuario.id, motivo.trim()]);
            await conexao.query("UPDATE usuarios SET banido=true WHERE id=$1", [usuario_id]);
            return r.rows[0];
        })
        return res.status(201).json({ msg: "Usuario banido", registro })
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.put("/:id/reativar", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const usuario = await db.transaction(async (conexao)=>{
            const r = await conexao.query("UPDATE banimentos SET ativo=false WHERE id=$1 AND ativo=true RETURNING usuario_id", [req.params.id]);
            if (!r.rowCount){
                throw new Error("Banimento ativo nao encontrado");
            }
            await conexao.query("UPDATE usuarios SET banido=false WHERE id=$1", [r.rows[0].usuario_id]);
            return r.rows[0];
        })
        return res.status(200).json({ msg: "Usuario reativado", usuario_id: usuario.usuario_id })
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
module.exports = router;
