const { Pool } = require("pg");
const pool = new Pool({
    host: process.env.DB_HOST || "database",
    user: process.env.DB_USER || "usuario",
    password: process.env.DB_PASS || "senha",
    database: process.env.DB_NAME || "bancodados",
    port: Number(process.env.DB_PORT || 5432)
});
function query(sql,params){
    return pool.query(sql, params)
}
async function transaction(operar){
    const client = await pool.connect();
    try{
        await client.query("BEGIN")
        const r = await operar(client)
        await client.query("COMMIT")
        return r;
    } catch (error){
        await client.query("ROLLBACK")
        throw error;
    } finally{
        client.release()
    }
}
module.exports = {query, transaction};
