require('./config/env');
const pool = require('./config/db');

async function migrate() {
    try {
        console.log('Adicionando colunas de tags (Firebird e IA) à tabela chat_sessions...');

        await pool.execute(`
            ALTER TABLE chat_sessions 
            ADD COLUMN firebird_version VARCHAR(10) DEFAULT '2.5',
            ADD COLUMN ai_provider VARCHAR(20) DEFAULT 'openai'
        `);

        console.log('✅ Colunas firebird_version e ai_provider adicionadas com sucesso!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Erro na migração das tags:', e);
        process.exit(1);
    }
}

migrate();
