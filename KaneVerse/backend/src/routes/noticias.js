const express = require("express");
const router = express.Router();
const db = require("../db");
const autenticaUsuario = require("../middlewares/autenticaUsuario");
const verificaId = require("../middlewares/verificaId");
const verificaAdmin = require("../middlewares/verificaAdmin");
const { upload, verificaImagem, enviaImagem } = require("../middlewares/upload");

router.get("/", async (req,res)=>{
    try{
        const r = await db.query("SELECT p.id,p.titulo,p.subtitulo,p.conteudo,p.categoria,p.editada,p.data_noticia,p.usuario_id,u.nome_usuario,p.foto IS NOT NULL AS tem_foto FROM noticias p JOIN usuarios u ON p.usuario_id=u.id ORDER BY p.data_noticia DESC,p.id DESC")
        return res.status(200).json(r.rows)
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar noticias"})
    }
})

router.get("/:id/foto", verificaId, async (req,res)=>{
    try{
        const r = await db.query("SELECT foto FROM noticias WHERE id=$1", [req.id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Noticia nao encontrada"})
        }
        return enviaImagem(res, r.rows[0].foto)
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar foto"})
    }
})

router.get("/:id", verificaId, async (req,res)=>{
    try{
        const r = await db.query("SELECT p.id,p.titulo,p.subtitulo,p.conteudo,p.categoria,p.editada,p.data_noticia,p.usuario_id,u.nome_usuario,p.foto IS NOT NULL AS tem_foto FROM noticias p JOIN usuarios u ON p.usuario_id=u.id WHERE p.id=$1", [req.id])
        if(!r.rowCount){
            return res.status(404).json({msg: "Noticia nao encontrada"})
        }
        return res.status(200).json(r.rows[0])
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar noticia"})
    }
})

router.post("/", autenticaUsuario, verificaAdmin, async (req,res)=>{
    try{
        let { titulo, subtitulo, conteudo, categoria="Harry Kane" } = req.body || {};
        if(typeof titulo !== "string" || !titulo.trim() || titulo.length > 255){
            return res.status(400).json({msg: "Titulo invalido"})
        }
        if(typeof subtitulo !== "string" || !subtitulo.trim() || subtitulo.length > 500){
            return res.status(400).json({msg: "Subtitulo invalido"})
        }
        if(typeof conteudo !== "string" || !conteudo.trim()){
            return res.status(400).json({msg: "Conteudo invalido"})
        }
        if(typeof categoria !== "string" || !categoria.trim() || categoria.length > 50){
            return res.status(400).json({msg: "Categoria invalida"})
        }
        const r = await db.query("INSERT INTO noticias (titulo,subtitulo,conteudo,categoria,usuario_id) VALUES ($1,$2,$3,$4,$5) RETURNING id,titulo,subtitulo,conteudo,categoria,editada,data_noticia,usuario_id,foto IS NOT NULL AS tem_foto", [titulo.trim(), subtitulo.trim(), conteudo.trim(), categoria.trim(), req.usuario.id])
        if(!r.rowCount){
            throw new Error("Noticia nao criada")
        }
        const publicacao = r.rows[0];
        return res.status(201).json({msg: "Noticia criada com sucesso", noticia: publicacao})
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao criar noticia"})
    }
})

router.put("/:id", autenticaUsuario, verificaAdmin, verificaId, async (req,res)=>{
    try{
        let { titulo, subtitulo, conteudo, categoria="Harry Kane" } = req.body || {};
        if(typeof titulo !== "string" || !titulo.trim() || titulo.length > 255){
            return res.status(400).json({msg: "Titulo invalido"})
        }
        if(typeof subtitulo !== "string" || !subtitulo.trim() || subtitulo.length > 500){
            return res.status(400).json({msg: "Subtitulo invalido"})
        }
        if(typeof conteudo !== "string" || !conteudo.trim()){
            return res.status(400).json({msg: "Conteudo invalido"})
        }
        if(typeof categoria !== "string" || !categoria.trim() || categoria.length > 50){
            return res.status(400).json({msg: "Categoria invalida"})
        }
        const r1 = await db.query("SELECT usuario_id FROM noticias WHERE id=$1", [req.id])
        if(!r1.rowCount){
            return res.status(404).json({msg: "Noticia nao encontrada"})
        }
        const r2 = await db.query("UPDATE noticias SET titulo=$1,subtitulo=$2,conteudo=$3,categoria=$4,editada=TRUE WHERE id=$5 RETURNING id,titulo,subtitulo,conteudo,categoria,editada,data_noticia,usuario_id,foto IS NOT NULL AS tem_foto", [titulo.trim(), subtitulo.trim(), conteudo.trim(), categoria.trim(), req.id])
        if(!r2.rowCount){
            return res.status(404).json({msg: "Noticia nao encontrada"})
        }
        return res.status(200).json({msg: "Noticia editada com sucesso", noticia: r2.rows[0]})
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao editar noticia"})
    }
})

router.delete("/:id", autenticaUsuario, verificaAdmin, verificaId, async (req,res)=>{
    try{
        const r1 = await db.query("SELECT usuario_id FROM noticias WHERE id=$1", [req.id])
        if(!r1.rowCount){
            return res.status(404).json({msg: "Noticia nao encontrada"})
        }
        const r2 = await db.query("DELETE FROM noticias WHERE id=$1", [req.id])
        if(!r2.rowCount){
            return res.status(404).json({msg: "Noticia nao encontrada"})
        }
        return res.status(200).json({msg: "Noticia excluida com sucesso"})
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao excluir noticia"})
    }
})

router.put("/:id/foto", autenticaUsuario, verificaAdmin, verificaId, upload.single("foto"), verificaImagem, async (req,res)=>{
    try{
        const r1 = await db.query("SELECT usuario_id FROM noticias WHERE id=$1", [req.id])
        if(!r1.rowCount){
            return res.status(404).json({msg: "Noticia nao encontrada"})
        }
        const r2 = await db.query("UPDATE noticias SET foto=$1,editada=TRUE WHERE id=$2", [req.file.buffer, req.id])
        if(!r2.rowCount){
            return res.status(404).json({msg: "Noticia nao encontrada"})
        }
        return res.status(200).json({msg: "Foto atualizada"})
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao salvar foto"})
    }
})

router.delete("/:id/foto", autenticaUsuario, verificaAdmin, verificaId, async (req,res)=>{
    try{
        const r1 = await db.query("SELECT usuario_id FROM noticias WHERE id=$1", [req.id])
        if(!r1.rowCount){
            return res.status(404).json({msg: "Noticia nao encontrada"})
        }
        const r2 = await db.query("UPDATE noticias SET foto=NULL,editada=TRUE WHERE id=$1", [req.id])
        if(!r2.rowCount){
            return res.status(404).json({msg: "Noticia nao encontrada"})
        }
        return res.status(200).json({msg: "Foto removida"})
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao remover foto"})
    }
})

module.exports = router;
