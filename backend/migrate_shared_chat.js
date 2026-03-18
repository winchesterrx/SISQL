require('./config/env');
const pool = require('./config/db');

async function migrate() {
    try {
        console.log('Iniciando migração para Chat Compartilhado...');

        // 1. Verificar se a coluna já existe
        const [columns] = await pool.execute('SHOW COLUMNS FROM chat_sessions LIKE "bancada_id"');

        if (columns.length === 0) {
            console.log('Adicionando coluna bancada_id...');
            await pool.execute('ALTER TABLE chat_sessions ADD COLUMN bancada_id INT AFTER usuario_id');

            // 2. Preencher bancada_id retroativamente
            console.log('Preenchendo bancada_id retroativamente...');
            await pool.execute(`
                UPDATE chat_sessions s
                JOIN usuarios u ON s.usuario_id = u.id
                SET s.bancada_id = u.bancada_id
                WHERE s.bancada_id IS NULL
            `);

            // 3. Adicionar constraint
            console.log('Adicionando foreign key para bancada_id...');
            await pool.execute('ALTER TABLE chat_sessions ADD CONSTRAINT fk_chat_bancada FOREIGN KEY (bancada_id) REFERENCES bancadas(id)');

            console.log('✅ Migração de chat_sessions concluída.');
        } else {
            console.log('ℹ️ Coluna bancada_id já existe.');
        }

        console.log('🚀 Sistema de Chat Compartilhado preparado no Banco de Dados!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Erro na migração:', e);
        process.exit(1);
    }
}

migrate();
