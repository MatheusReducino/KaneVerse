const express = require("express");
const router = express.Router();
const db = require("../db");
const autenticaUsuario = require("../middlewares/autenticaUsuario");
const verificaId = require("../middlewares/verificaId");
const verificaPublicacao = require("../middlewares/verificaPublicacao");

router.get("/post/:id", verificaId, async (req,res)=>{
    try{
        const r = await db.query("SELECT c.*,u.nome_usuario FROM comentarios c JOIN usuarios u ON c.usuario_id=u.id WHERE c.post_id=$1 ORDER BY c.id", [req.id])
        return res.status(200).json(r.rows)
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar comentarios"})
    }
})

router.get("/noticia/:id", verificaId, async (req,res)=>{
    try{
        const r = await db.query("SELECT c.*,u.nome_usuario FROM comentarios c JOIN usuarios u ON c.usuario_id=u.id WHERE c.noticia_id=$1 ORDER BY c.id", [req.id])
        return res.status(200).json(r.rows)
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar comentarios"})
    }
})


router.post("/", autenticaUsuario, verificaPublicacao, async (req,res)=>{
    try{
        const { texto } = req.body || {};
        if(typeof texto !== "string" || !texto.trim()){
            return res.status(400).json({msg: "Comentario invalido"})
        }
        const comentario = await db.transaction(async (client)=>{
            const r1 = await client.query("INSERT INTO comentarios (texto,usuario_id,post_id,noticia_id) VALUES ($1,$2,$3,$4) RETURNING *", [texto.trim(), req.usuario.id, req.post_id, req.noticia_id])
            const r2 = await client.query("UPDATE usuarios SET kane_points=LEAST(kane_points::bigint+2,2147483647)::integer WHERE id=$1", [req.usuario.id])
            if(!r1.rowCount || !r2.rowCount){
                throw new Error("Comentario nao criado")
            }
            return r1.rows[0];
        })
        return res.status(201).json({msg: "Comentario criado", comentario})
    } catch (error){
        if(error.code === "23503"){
            return res.status(404).json({msg: "Usuario ou publicacao nao encontrada"})
        }
        console.error(error)
        return res.status(500).json({msg: "Erro ao criar comentario"})
    }
})

router.put("/:id", autenticaUsuario, verificaId, async (req,res)=>{
    try{
        const { texto } = req.body || {};
        if(typeof texto !== "string" || !texto.trim()){
            return res.status(400).json({msg: "Comentario invalido"})
        }
        const r1 = await db.query("SELECT usuario_id FROM comentarios WHERE id=$1", [req.id])
        if(!r1.rowCount){
            return res.status(404).json({msg: "Comentario nao encontrado"})
        }
        if(r1.rows[0].usuario_id !== req.usuario.id){
            return res.status(403).json({msg: "Voce nao pode editar esse comentario"})
        }
        const r2 = await db.query("UPDATE comentarios SET texto=$1 WHERE id=$2 AND usuario_id=$3 RETURNING *", [texto.trim(), req.id, req.usuario.id])
        if(!r2.rowCount){
            return res.status(404).json({msg: "Comentario nao encontrado"})
        }
        return res.status(200).json({msg: "Comentario editado", comentario: r2.rows[0]})
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao editar comentario"})
    }
})

router.delete("/:id", autenticaUsuario, verificaId, async (req,res)=>{
    try{
        const r1 = await db.query("SELECT usuario_id FROM comentarios WHERE id=$1", [req.id])
        if(!r1.rowCount){
            return res.status(404).json({msg: "Comentario nao encontrado"})
        }
        if(r1.rows[0].usuario_id !== req.usuario.id && !req.usuario.admin){
            return res.status(403).json({msg: "Voce nao pode excluir esse comentario"})
        }
        const r2 = await db.query("DELETE FROM comentarios WHERE id=$1 AND (usuario_id=$2 OR $3=TRUE)", [req.id, req.usuario.id, req.usuario.admin])
        if(!r2.rowCount){
            return res.status(404).json({msg: "Comentario nao encontrado"})
        }
        return res.status(200).json({msg: "Comentario excluido"})
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao excluir comentario"})
    }
})

module.exports = router;
