const express = require("express");
const router = express.Router();
const db = require("../db");
const autenticaUsuario = require("../middlewares/autenticaUsuario");
const verificaId = require("../middlewares/verificaId");
const verificaAdmin = require("../middlewares/verificaAdmin");
const verificaPublicacao = require("../middlewares/verificaPublicacao");

router.get("/", async (req,res)=>{
    try{
        const r = await db.query("SELECT * FROM palavraschave ORDER BY palavra")
        return res.status(200).json(r.rows)
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar palavras-chave"})
    }
})

router.get("/post/:id", verificaId, async (req,res)=>{
    try{
        const r = await db.query("SELECT ppc.id AS vinculo_id,pc.id,pc.palavra FROM publicacao_palavrachave ppc JOIN palavraschave pc ON ppc.palavra_id=pc.id WHERE ppc.post_id=$1 ORDER BY pc.palavra", [req.id])
        return res.status(200).json(r.rows)
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar palavras do post"})
    }
})

router.get("/noticia/:id", verificaId, async (req,res)=>{
    try{
        const r = await db.query("SELECT ppc.id AS vinculo_id,pc.id,pc.palavra FROM publicacao_palavrachave ppc JOIN palavraschave pc ON ppc.palavra_id=pc.id WHERE ppc.noticia_id=$1 ORDER BY pc.palavra", [req.id])
        return res.status(200).json(r.rows)
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar palavras da noticia"})
    }
})

router.get("/:id", verificaId, async (req,res)=>{
    try{
        const r = await db.query("SELECT * FROM palavraschave WHERE id=$1", [req.id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Palavra-chave nao encontrada"})
        }
        return res.status(200).json(r.rows[0])
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar palavra-chave"})
    }
})

router.post("/", autenticaUsuario, verificaAdmin, async (req,res)=>{
    try{
        const { palavra } = req.body || {};
        if(typeof palavra !== "string" || !palavra.trim() || palavra.length > 50){
            return res.status(400).json({msg: "Palavra-chave invalida"})
        }
        const r1 = await db.query("SELECT id FROM palavraschave WHERE palavra=$1", [palavra.trim()])
        if(r1.rowCount){
            return res.status(409).json({msg: "Palavra-chave ja cadastrada"})
        }
        const r2 = await db.query("INSERT INTO palavraschave (palavra) VALUES ($1) RETURNING *", [palavra.trim()])
        if(!r2.rowCount){
            throw new Error("Palavra-chave nao criada")
        }
        return res.status(201).json({msg: "Palavra-chave criada", palavra: r2.rows[0]})
    } catch (error){
        if(error.code === "23505"){
            return res.status(409).json({msg: "Palavra-chave ja cadastrada"})
        }
        console.error(error)
        return res.status(500).json({msg: "Erro ao criar palavra-chave"})
    }
})

router.put("/:id", autenticaUsuario, verificaAdmin, verificaId, async (req,res)=>{
    try{
        const { palavra } = req.body || {};
        if(typeof palavra !== "string" || !palavra.trim() || palavra.length > 50){
            return res.status(400).json({msg: "Palavra-chave invalida"})
        }
        const r1 = await db.query("SELECT id FROM palavraschave WHERE palavra=$1 AND id<>$2", [palavra.trim(), req.id])
        if(r1.rowCount){
            return res.status(409).json({msg: "Palavra-chave ja cadastrada"})
        }
        const r2 = await db.query("UPDATE palavraschave SET palavra=$1 WHERE id=$2 RETURNING *", [palavra.trim(), req.id])
        if(!r2.rowCount){
            return res.status(404).json({msg: "Palavra-chave nao encontrada"})
        }
        return res.status(200).json({msg: "Palavra-chave atualizada", palavra: r2.rows[0]})
    } catch (error){
        if(error.code === "23505"){
            return res.status(409).json({msg: "Palavra-chave ja cadastrada"})
        }
        console.error(error)
        return res.status(500).json({msg: "Erro ao editar palavra-chave"})
    }
})

router.delete("/:id", autenticaUsuario, verificaAdmin, verificaId, async (req,res)=>{
    try{
        const r = await db.query("DELETE FROM palavraschave WHERE id=$1", [req.id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Palavra-chave nao encontrada"})
        }
        return res.status(200).json({msg: "Palavra-chave excluida"})
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao excluir palavra-chave"})
    }
})

router.post("/vincular", autenticaUsuario, verificaPublicacao, async (req,res)=>{
    try{
        const { palavra_id } = req.body || {};
        if(!Number.isInteger(palavra_id) || palavra_id <= 0 || palavra_id > 2147483647){
            return res.status(400).json({msg: "Id da palavra-chave invalido"})
        }
        if(req.noticia_id !== null && !req.usuario.admin){
            return res.status(403).json({msg: "Apenas administradores podem vincular palavras a noticias"})
        }
        if(req.post_id !== null && !req.usuario.admin){
            const r1 = await db.query("SELECT usuario_id FROM posts WHERE id=$1", [req.post_id])
            if(!r1.rowCount){
                return res.status(404).json({msg: "Post nao encontrado"})
            }
            if(r1.rows[0].usuario_id !== req.usuario.id){
                return res.status(403).json({msg: "Voce nao pode alterar esse post"})
            }
        }
        const r2 = await db.query("SELECT id FROM palavraschave WHERE id=$1", [palavra_id])
        if(!r2.rowCount){
            return res.status(404).json({msg: "Palavra-chave nao encontrada"})
        }
        const r3 = await db.query("INSERT INTO publicacao_palavrachave (post_id,noticia_id,palavra_id) VALUES ($1,$2,$3) RETURNING *", [req.post_id, req.noticia_id, palavra_id])
        if(!r3.rowCount){
            throw new Error("Vinculo nao criado")
        }
        return res.status(201).json({msg: "Palavra-chave vinculada", vinculo: r3.rows[0]})
    } catch (error){
        if(error.code === "23505"){
            return res.status(409).json({msg: "Palavra-chave ja vinculada"})
        }
        if(error.code === "23503"){
            return res.status(404).json({msg: "Publicacao ou palavra nao encontrada"})
        }
        console.error(error)
        return res.status(500).json({msg: "Erro ao vincular palavra-chave"})
    }
})

router.delete("/vinculo/:id", autenticaUsuario, verificaId, async (req,res)=>{
    try{
        const r1 = await db.query("SELECT ppc.noticia_id,p.usuario_id FROM publicacao_palavrachave ppc LEFT JOIN posts p ON ppc.post_id=p.id WHERE ppc.id=$1", [req.id])
        if(!r1.rowCount){
            return res.status(404).json({msg: "Vinculo nao encontrado"})
        }
        if(!req.usuario.admin && (r1.rows[0].noticia_id !== null || r1.rows[0].usuario_id !== req.usuario.id)){
            return res.status(403).json({msg: "Voce nao pode excluir esse vinculo"})
        }
        const r2 = await db.query("DELETE FROM publicacao_palavrachave WHERE id=$1", [req.id])
        if(!r2.rowCount){
            return res.status(404).json({msg: "Vinculo nao encontrado"})
        }
        return res.status(200).json({msg: "Vinculo removido"})
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao remover vinculo"})
    }
})

module.exports = router;
