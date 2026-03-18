require('./config/env');
const db = require('./config/db');

const migrate = async () => {
    try {
        console.log("Iniciando migração ATLAS...");
        await db.execute(`
            CREATE TABLE IF NOT EXISTS ai_memory (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                key_name VARCHAR(100) NOT NULL,
                value TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY (user_id, key_name)
            )
        `);
        console.log("Tabela ai_memory verificada com sucesso!");
        process.exit(0);
    } catch (err) {
        console.error("Erro na migração:", err);
        process.exit(1);
    }
};

migrate();
