const db = require("../db");
async function verificaPublicacao(req,res,next){
    try{
        let { post_id, noticia_id } = req.body || {};
        post_id = post_id ?? null;
        noticia_id = noticia_id ?? null;
        if((post_id === null && noticia_id === null) || (post_id !== null && noticia_id !== null)){
            return res.status(400).json({msg: "Informe apenas um post ou uma noticia"})
        }
        if(post_id !== null && (!Number.isInteger(post_id) || post_id <= 0 || post_id > 2147483647)){
            return res.status(400).json({msg: "Id do post invalido"})
        }
        if(noticia_id !== null && (!Number.isInteger(noticia_id) || noticia_id <= 0 || noticia_id > 2147483647)){
            return res.status(400).json({msg: "Id da noticia invalido"})
        }
        let r;
        if(post_id !== null){
            r = await db.query("SELECT id FROM posts WHERE id=$1", [post_id])
        } else{
            r = await db.query("SELECT id FROM noticias WHERE id=$1", [noticia_id])
        }
        if(!r.rowCount){
            return res.status(404).json({msg: "Publicacao nao encontrada"})
        }
        req.post_id = post_id;
        req.noticia_id = noticia_id;
        next()
    } catch (error){
        console.error(error)
        return res.status(500).json({msg: "Erro ao buscar publicacao"})
    }
}
module.exports = verificaPublicacao;
