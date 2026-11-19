const express = require("express");
const router = express.Router();
const db = require("../db");
const { idValido } = require("../middlewares/validacoes");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");

router.get("/", async (req, res)=>{
    try{
        const r = await db.query("SELECT ut.*, u.nome_usuario, t.nome_titulo FROM usuario_titulo ut JOIN usuarios u ON u.id=ut.usuario_id JOIN titulos t ON t.id=ut.titulo_id ORDER BY ut.data_desbloqueio DESC");
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
        const r = await db.query("SELECT t.*, ut.data_desbloqueio FROM usuario_titulo ut JOIN titulos t ON t.id=ut.titulo_id WHERE ut.usuario_id=$1 ORDER BY ut.data_desbloqueio", [req.params.id]);
        return res.status(200).json(r.rows);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.get("/disponiveis/:id", async (req, res)=>{
    try{
        if (!idValido(req.params.id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const r = await db.query("SELECT t.*, u.kane_points, (u.kane_points >= t.kane_points_desbloqueio) AS pode_comprar FROM titulos t CROSS JOIN usuarios u WHERE u.id=$1 AND NOT EXISTS (SELECT 1 FROM usuario_titulo ut WHERE ut.titulo_id=t.id AND ut.usuario_id=u.id) ORDER BY t.kane_points_desbloqueio", [req.params.id]);
        return res.status(200).json(r.rows);
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.use(verificarToken);
router.post("/", async (req, res)=>{
    try{
        const { titulo_id } = req.body || {};
        if (!idValido(titulo_id)){
            return res.status(400).json({ msg: "titulo_id deve ser um inteiro positivo" })
        }
        if (!titulo_id){
            return res.status(400).json({ msg: "Informe titulo_id" })
        }
        const compra = await db.transaction(async (conexao)=>{
            const usuario = await conexao.query("SELECT id, kane_points FROM usuarios WHERE id=$1 FOR UPDATE", [req.usuario.id]);
            const titulo = await conexao.query("SELECT id, nome_titulo, kane_points_desbloqueio FROM titulos WHERE id=$1", [titulo_id]);
            if (!titulo.rowCount){
                throw new Error("Titulo nao encontrado");
            }
            const existe = await conexao.query("SELECT 1 FROM usuario_titulo WHERE usuario_id=$1 AND titulo_id=$2", [req.usuario.id, titulo_id]);
            if (existe.rowCount){
                throw new Error("Voce ja possui este titulo");
            }
            const custo = titulo.rows[0].kane_points_desbloqueio;
            if (usuario.rows[0].kane_points < custo){
                throw new Error("Kane Points insuficientes");
            }
            await conexao.query("UPDATE usuarios SET kane_points=kane_points-$1 WHERE id=$2", [custo, req.usuario.id]);
            const r = await conexao.query("INSERT INTO usuario_titulo (usuario_id, titulo_id) VALUES ($1,$2) RETURNING *", [req.usuario.id, titulo_id]);
            return r.rows[0];
        })
        return res.status(201).json({ msg: "Titulo desbloqueado", compra })
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
router.delete("/:usuario_id/:titulo_id", verificarAdmin, async (req, res)=>{
    try{
        if (!idValido(req.params.usuario_id) || !idValido(req.params.titulo_id)){
            return res.status(400).json({ msg: "ID invalido" })
        }

        const r = await db.query("DELETE FROM usuario_titulo WHERE usuario_id=$1 AND titulo_id=$2 RETURNING *", [req.params.usuario_id, req.params.titulo_id]);
        if (!r.rowCount){
            return res.status(404).json({ msg: "Relacao nao encontrada" })
        }
        return res.status(200).json({ msg: "Titulo revogado; sem reembolso automatico" })
    } catch (error){
        return res.status(400).json({ msg: error.message })
    }
})
module.exports = router;
