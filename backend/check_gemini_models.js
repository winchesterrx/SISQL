require('./config/env');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // O SDK do Google não tem um "listModels" direto no genAI, mas podemos testar nomes comuns
        const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro'];

        console.log('--- TESTANDO NOMES DE MODELOS ---');
        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                await model.generateContent("oi");
                console.log(`✅ MODELO [${m}] ESTÁ DISPONÍVEL!`);
            } catch (e) {
                console.log(`❌ MODELO [${m}] FALHOU:`, e.message);
            }
        }
    } catch (err) {
        console.error('ERRO GERAL:', err);
    }
}

listModels();
