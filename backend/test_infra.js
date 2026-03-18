require('./config/env');
const pool = require('./config/db');

async function test() {
    console.log('--- TESTE DE INFRAESTRUTURA ---');
    console.log('OpenAI Key:', !!process.env.OPENAI_API_KEY);
    console.log('Gemini Key:', !!process.env.GEMINI_API_KEY);
    console.log('DB Host:', process.env.DB_HOST);

    try {
        const [rows] = await pool.execute('SELECT 1 as ok');
        console.log('Database: CONECTADO');
    } catch (e) {
        console.error('Database: ERRO', e.message);
    }

    try {
        const [rows] = await pool.execute('SELECT COUNT(*) as count FROM sistemas');
        console.log('Sistemas no DB:', rows[0].count);
    } catch (e) {
        console.error('Erro ao contar sistemas:', e.message);
    }

    try {
        const [rows] = await pool.execute('SELECT COUNT(*) as count FROM bancadas');
        console.log('Bancadas no DB:', rows[0].count);
    } catch (e) {
        console.error('Erro ao contar bancadas:', e.message);
    }

    process.exit();
}

test();
