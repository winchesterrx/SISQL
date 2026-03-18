require('./config/env');
const pool = require('./config/db');
const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function diagnose() {
    console.log('=== DIAGNÓSTICO DE SISTEMA AI ===');

    // 1. Env
    console.log('OPENAI_KEY:', process.env.OPENAI_API_KEY ? '✅ OK (' + process.env.OPENAI_API_KEY.substring(0, 5) + '...)' : '❌ AUSENTE');
    console.log('GEMINI_KEY:', process.env.GEMINI_API_KEY ? '✅ OK (' + process.env.GEMINI_API_KEY.substring(0, 5) + '...)' : '❌ AUSENTE');

    // 2. DB
    try {
        const [rows] = await pool.execute('SELECT 1 + 1 AS result');
        console.log('CONEXÃO DB:', rows[0].result === 2 ? '✅ OK' : '❌ FALHA');
    } catch (e) {
        console.error('ERRO DB:', e.message);
    }

    // 3. Teste OpenAI
    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const res = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "oi" }],
            max_tokens: 5
        });
        console.log('TESTE OPENAI:', res.choices[0] ? '✅ OK' : '❌ RESPOSTA VAZIA');
    } catch (e) {
        console.error('ERRO OPENAI:', e.message);
    }

    // 4. Teste Gemini
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("oi");
        const response = await result.response;
        console.log('TESTE GEMINI:', response.text() ? '✅ OK' : '❌ RESPOSTA VAZIA');
    } catch (e) {
        console.error('ERRO GEMINI:', e.message);
    }

    process.exit();
}

diagnose();
