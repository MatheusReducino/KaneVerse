function verificaId(req,res,next){
    const id = Number(req.params.id);
    if(!Number.isInteger(id) || id <= 0 || id > 2147483647){
        return res.status(400).json({msg: "Id invalido"})
    }
    req.id = id;
    next()
}
module.exports = verificaId;
