const pool = require('./config/db');

async function migrate() {
    try {
        console.log('Iniciando migração do histórico de chat...');

        // 1. Criar tabela de sessões
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                sistema_id INT NOT NULL,
                titulo VARCHAR(255) DEFAULT 'Nova Conversa',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
                FOREIGN KEY (sistema_id) REFERENCES sistemas(id)
            ) ENGINE=InnoDB;
        `);
        console.log('✅ Tabela chat_sessions criada/verificada.');

        // 2. Criar tabela de mensagens
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id INT NOT NULL,
                role ENUM('user', 'ai', 'error') NOT NULL,
                content LONGTEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);
        console.log('✅ Tabela chat_messages criada/verificada.');

        console.log('🚀 Migração concluída com sucesso!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Erro na migração:', e);
        process.exit(1);
    }
}

migrate();
