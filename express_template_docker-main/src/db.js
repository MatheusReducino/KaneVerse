require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "kaneverse"
})

async function query(sql, parametros){
    return pool.query(sql, parametros);
}

async function transaction(funcao){
    const conexao = await pool.connect();
    try{
        await conexao.query("BEGIN");
        const resultado = await funcao(conexao);
        await conexao.query("COMMIT");
        return resultado;
    } catch (error){
        await conexao.query("ROLLBACK");
        throw error;
    } finally {
        conexao.release();
    }
}

module.exports = { query, transaction };
