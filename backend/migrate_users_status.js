require('dotenv').config();
const pool = require('./config/db');

async function migrate() {
    try {
        console.log("Conectado ao DB. Verificando se a coluna 'status' existe...");
        const [columns] = await pool.execute("SHOW COLUMNS FROM usuarios LIKE 'status'");
        
        if (columns.length === 0) {
            console.log("Coluna 'status' não encontrada. Criando...");
            await pool.execute("ALTER TABLE usuarios ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'");
            console.log("Coluna criada. Atualizando usuários antigos para 'approved'...");
            await pool.execute("UPDATE usuarios SET status = 'approved'");
            console.log("Migração concluída com sucesso!");
        } else {
            console.log("A coluna 'status' já existe.");
        }
        
        process.exit(0);
    } catch (err) {
        console.error("Erro na migração:", err);
        process.exit(1);
    }
}

migrate();
