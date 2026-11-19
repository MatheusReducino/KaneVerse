require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/auth", require("./routes/auth"));
app.use("/usuarios", require("./routes/usuarios"));
app.use("/posts", require("./routes/posts"));
app.use("/noticias", require("./routes/noticias"));
app.use("/comentariosposts", require("./routes/comentariosposts"));
app.use("/comentariosnoticias", require("./routes/comentariosnoticias"));
app.use("/reacoesposts", require("./routes/reacoesposts"));
app.use("/reacoesnoticias", require("./routes/reacoesnoticias"));
app.use("/palavraschave", require("./routes/palavraschave"));
app.use("/post_palavrachave", require("./routes/post_palavrachave"));
app.use("/noticias_palavraschave", require("./routes/noticias_palavraschave"));
app.use("/titulos", require("./routes/titulos"));
app.use("/usuario_titulo", require("./routes/usuario_titulo"));
app.use("/banimentos", require("./routes/banimentos"));

app.get("/", (req, res)=>{
    return res.sendFile(path.join(__dirname, "static", "documentacao.html"))
})
app.get("/documentacao", (req, res)=>{
    return res.sendFile(path.join(__dirname, "static", "documentacao.html"))
})

app.use((error, req, res, next)=>{
    return res.status(400).json({ msg: error.message })
})

if (require.main === module){
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.startsWith("SUBSTITUA_")){
        console.error("Configure JWT_SECRET no arquivo .env");
        process.exit(1);
    }
    const porta = Number(process.env.PORT || 3000);
    app.listen(porta, ()=>{
        console.log("Servidor executando em http://localhost:" + porta);
    })
}

module.exports = app;
