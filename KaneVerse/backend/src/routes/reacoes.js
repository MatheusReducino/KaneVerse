const express = require("express");
const router = express.Router();
const db = require("../db");
const autenticaUsuario = require("../middlewares/autenticaUsuario");
const verificaId = require("../middlewares/verificaId");
const verificaPublicacao = require("../middlewares/verificaPublicacao");

router.get("/post/:id", verificaId, async (req,res)=>{
    try{
        const r = await db.query("SELECT r.*,u.nome_usuario FROM reacoes r JOIN usuarios u ON r.usuario_id=u.id WHERE r.post_id=$1 ORDER BY r.id", [req.id])
        return res.status(200).json(r.rows)
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar reacoes"})
    }
})

router.get("/noticia/:id", verificaId, async (req,res)=>{
    try{
        const r = await db.query("SELECT r.*,u.nome_usuario FROM reacoes r JOIN usuarios u ON r.usuario_id=u.id WHERE r.noticia_id=$1 ORDER BY r.id", [req.id])
        return res.status(200).json(r.rows)
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar reacoes"})
    }
})


router.post("/", autenticaUsuario, verificaPublicacao, async (req,res)=>{
    try{
        const { tipo } = req.body || {};
        if(!["curtida", "fogo", "caveira", "risada"].includes(tipo)){
            return res.status(400).json({msg: "Tipo de reacao invalido"})
        }
        let r;
        if(req.post_id !== null){
            r = await db.query("INSERT INTO reacoes (tipo,usuario_id,post_id) VALUES ($1,$2,$3) ON CONFLICT (usuario_id,post_id) DO UPDATE SET tipo=EXCLUDED.tipo RETURNING *", [tipo, req.usuario.id, req.post_id])
        } else{
            r = await db.query("INSERT INTO reacoes (tipo,usuario_id,noticia_id) VALUES ($1,$2,$3) ON CONFLICT (usuario_id,noticia_id) DO UPDATE SET tipo=EXCLUDED.tipo RETURNING *", [tipo, req.usuario.id, req.noticia_id])
        }
        if(!r.rowCount){
            throw new Error("Reacao nao registrada")
        }
        return res.status(200).json({msg: "Reacao registrada", reacao: r.rows[0]})
    } catch (error){
        if(error.code === "23503"){
            return res.status(404).json({msg: "Usuario ou publicacao nao encontrada"})
        }
        console.error(error)
        return res.status(500).json({msg: "Erro ao registrar reacao"})
    }
})

router.delete("/:id", autenticaUsuario, verificaId, async (req,res)=>{
    try{
        const r1 = await db.query("SELECT usuario_id FROM reacoes WHERE id=$1", [req.id])
        if(!r1.rowCount){
            return res.status(404).json({msg: "Reacao nao encontrada"})
        }
        if(r1.rows[0].usuario_id !== req.usuario.id){
            return res.status(403).json({msg: "Voce nao pode remover essa reacao"})
        }
        const r2 = await db.query("DELETE FROM reacoes WHERE id=$1 AND usuario_id=$2", [req.id, req.usuario.id])
        if(!r2.rowCount){
            return res.status(404).json({msg: "Reacao nao encontrada"})
        }
        return res.status(200).json({msg: "Reacao removida"})
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao remover reacao"})
    }
})

module.exports = router;
