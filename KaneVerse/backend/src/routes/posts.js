const express = require("express");
const router = express.Router();
const db = require("../db");
const autenticaUsuario = require("../middlewares/autenticaUsuario");
const verificaId = require("../middlewares/verificaId");
const { upload, verificaImagem, enviaImagem } = require("../middlewares/upload");

router.get("/", async (req,res)=>{
    try{
        const r = await db.query("SELECT p.id,p.texto,p.editado,p.data_post,p.usuario_id,u.nome_usuario,p.foto IS NOT NULL AS tem_foto FROM posts p JOIN usuarios u ON p.usuario_id=u.id ORDER BY p.data_post DESC,p.id DESC")
        return res.status(200).json(r.rows)
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar posts"})
    }
})

router.get("/:id/foto", verificaId, async (req,res)=>{
    try{
        const r = await db.query("SELECT foto FROM posts WHERE id=$1", [req.id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Post nao encontrado"})
        }
        return enviaImagem(res, r.rows[0].foto)
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar foto"})
    }
})

router.get("/:id", verificaId, async (req,res)=>{
    try{
        const r = await db.query("SELECT p.id,p.texto,p.editado,p.data_post,p.usuario_id,u.nome_usuario,p.foto IS NOT NULL AS tem_foto FROM posts p JOIN usuarios u ON p.usuario_id=u.id WHERE p.id=$1", [req.id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Post nao encontrado"})
        }
        return res.status(200).json(r.rows[0])
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar post"})
    }
})

router.post("/", autenticaUsuario, async (req,res)=>{
    try{
        const { texto } = req.body || {};
        if(typeof texto !== "string" || !texto.trim()){
            return res.status(400).json({msg: "Texto do post invalido"})
        }
        const publicacao = await db.transaction(async (client)=>{
            const r1 = await client.query("INSERT INTO posts (texto,usuario_id) VALUES ($1,$2) RETURNING id,texto,editado,data_post,usuario_id,foto IS NOT NULL AS tem_foto", [texto.trim(), req.usuario.id])
            const r2 = await client.query("UPDATE usuarios SET kane_points=LEAST(kane_points::bigint+10,2147483647)::integer WHERE id=$1", [req.usuario.id])
            if(!r1.rowCount || !r2.rowCount){
                throw new Error("Post nao criado")
            }
            return r1.rows[0];
        })
        return res.status(201).json({msg: "Post criado com sucesso", post: publicacao})
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao criar post"})
    }
})

router.put("/:id", autenticaUsuario, verificaId, async (req,res)=>{
    try{
        const { texto } = req.body || {};
        if(typeof texto !== "string" || !texto.trim()){
            return res.status(400).json({msg: "Texto do post invalido"})
        }
        const r1 = await db.query("SELECT usuario_id FROM posts WHERE id=$1", [req.id])
        if(!r1.rowCount){
            return res.status(404).json({msg: "Post nao encontrado"})
        }
        if(r1.rows[0].usuario_id !== req.usuario.id){
            return res.status(403).json({msg: "Voce nao pode alterar esse post"})
        }
        const r2 = await db.query("UPDATE posts SET texto=$1,editado=TRUE WHERE id=$2 AND usuario_id=$3 RETURNING id,texto,editado,data_post,usuario_id,foto IS NOT NULL AS tem_foto", [texto.trim(), req.id, req.usuario.id])
        if(!r2.rowCount){
            return res.status(404).json({msg: "Post nao encontrado"})
        }
        return res.status(200).json({msg: "Post editado com sucesso", post: r2.rows[0]})
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao editar post"})
    }
})

router.delete("/:id", autenticaUsuario, verificaId, async (req,res)=>{
    try{
        const r1 = await db.query("SELECT usuario_id FROM posts WHERE id=$1", [req.id])
        if(!r1.rowCount){
            return res.status(404).json({msg: "Post nao encontrado"})
        }
        if(r1.rows[0].usuario_id !== req.usuario.id && !req.usuario.admin){
            return res.status(403).json({msg: "Voce nao pode excluir esse post"})
        }
        const r2 = await db.query("DELETE FROM posts WHERE id=$1 AND (usuario_id=$2 OR $3=TRUE)", [req.id, req.usuario.id, req.usuario.admin])
        if(!r2.rowCount){
            return res.status(404).json({msg: "Post nao encontrado"})
        }
        return res.status(200).json({msg: "Post excluido com sucesso"})
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao excluir post"})
    }
})

router.put("/:id/foto", autenticaUsuario, verificaId, upload.single("foto"), verificaImagem, async (req,res)=>{
    try{
        const r1 = await db.query("SELECT usuario_id FROM posts WHERE id=$1", [req.id])
        if(!r1.rowCount){
            return res.status(404).json({msg: "Post nao encontrado"})
        }
        if(r1.rows[0].usuario_id !== req.usuario.id){
            return res.status(403).json({msg: "Voce nao pode alterar esse post"})
        }
        const r2 = await db.query("UPDATE posts SET foto=$1,editado=TRUE WHERE id=$2 AND usuario_id=$3", [req.file.buffer, req.id, req.usuario.id])
        if(!r2.rowCount){
            return res.status(404).json({msg: "Post nao encontrado"})
        }
        return res.status(200).json({msg: "Foto atualizada"})
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao salvar foto"})
    }
})

router.delete("/:id/foto", autenticaUsuario, verificaId, async (req,res)=>{
    try{
        const r1 = await db.query("SELECT usuario_id FROM posts WHERE id=$1", [req.id])
        if(!r1.rowCount){
            return res.status(404).json({msg: "Post nao encontrado"})
        }
        if(r1.rows[0].usuario_id !== req.usuario.id){
            return res.status(403).json({msg: "Voce nao pode alterar esse post"})
        }
        const r2 = await db.query("UPDATE posts SET foto=NULL,editado=TRUE WHERE id=$1 AND usuario_id=$2", [req.id, req.usuario.id])
        if(!r2.rowCount){
            return res.status(404).json({msg: "Post nao encontrado"})
        }
        return res.status(200).json({msg: "Foto removida"})
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao remover foto"})
    }
})

module.exports = router;
