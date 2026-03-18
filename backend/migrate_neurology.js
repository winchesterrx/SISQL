require('./config/env');
const pool = require('./config/db');

async function migrate() {
    try {
        console.log('Iniciando migração para Memória Neural (Neurology)...');

        // 1. Criar tabela de sinapses (conhecimento permanente)
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS ia_synapses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sistema_id INT NOT NULL,
                usuario_id INT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sistema_id) REFERENCES sistemas(id) ON DELETE CASCADE,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
            ) ENGINE=InnoDB;
        `);
        console.log('✅ Tabela ia_synapses criada/verificada.');

        console.log('🚀 Cérebro Neural preparado no Banco de Dados!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Erro na migração:', e);
        process.exit(1);
    }
}

migrate();
