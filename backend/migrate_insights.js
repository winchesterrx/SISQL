const pool = require('./config/db');

const migrate = async () => {
    try {
        console.log('Iniciando migração de Insights...');

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS ia_insights (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sistema_id INT NOT NULL,
                usuario_id INT NOT NULL,
                session_id INT,
                tipo ENUM('aprendizado', 'correcao', 'refinamento') DEFAULT 'aprendizado',
                contexto TEXT,
                insight TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sistema_id) REFERENCES sistemas(id) ON DELETE CASCADE,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('Tabela ia_insights criada com sucesso!');
        process.exit(0);
    } catch (err) {
        console.error('Erro na migração:', err.message);
        process.exit(1);
    }
};

migrate();
