require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const trataErro = require("./middlewares/trataErro");

app.use(cors({origin: process.env.FRONTEND_URL || "http://localhost:5173"}));
app.use(express.json({limit: "1mb"}));
app.use("/usuarios", require("./routes/usuarios"));
app.use("/posts", require("./routes/posts"));
app.use("/noticias", require("./routes/noticias"));
app.use("/comentarios", require("./routes/comentarios"));
app.use("/reacoes", require("./routes/reacoes"));
app.use("/titulos", require("./routes/titulos"));
app.use("/palavraschave", require("./routes/palavraschave"));
app.use("/banimentos", require("./routes/banimentos"));
app.get(["/", "/documentacao"], (req,res)=>{
    return res.sendFile(path.join(__dirname, "static", "documentacao.html"))
})
app.use((req,res)=>{
    return res.status(404).json({msg: "Rota nao encontrada"})
})
app.use(trataErro);
if(require.main === module){
    if(!process.env.JWT_SECRET || process.env.JWT_SECRET.startsWith("SUBSTITUA")){
        console.error("Configure JWT_SECRET no .env (use um segredo aleatorio)")
        process.exit(1)
    }
    const porta = Number(process.env.PORT || 3000);
    app.listen(porta, ()=>{
        console.log("Servidor executando em http://localhost:"+porta)
    })
}
module.exports = app;
