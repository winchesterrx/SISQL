require('./config/env');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listAllModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // O SDK não tem listModels direto na classe principal, mas podemos usar a rota da API via fetch ou similar
        // Ou simplesmente testar os nomes exatos do painel
        const modelsToTest = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-8b",
            "gemini-1.5-pro",
            "gemini-2.0-flash",
            "gemini-2.0-flash-exp",
            "gemini-2.0-flash-lite-preview-02-05", // Lite Lite
            "gemini-pro"
        ];

        console.log('--- TESTANDO NOMES DO PAINEL ---');
        for (const m of modelsToTest) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                await model.generateContent("hi");
                console.log(`OK: ${m}`);
            } catch (e) {
                console.log(`ERROR ${m}: ${e.message.split('\n')[0]}`);
            }
        }
    } catch (err) {
        console.error('ERRO GERAL:', err);
    }
}

listAllModels();
