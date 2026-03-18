const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function list() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // The SDK doesn't have a direct listModels in the main class usually, 
        // but we can try to use the model names used in documentation.
        // Let's try to just check if ANY model works with a simple prompt.

        const models = ["gemini-1.5-flash-latest", "gemini-1.5-pro-latest", "gemini-pro", "gemini-1.0-pro"];

        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("test");
                console.log(`✅ O MODELO [${m}] ESTÁ FUNCIONANDO!`);
                process.exit(0);
            } catch (e) {
                console.log(`❌ O MODELO [${m}] FALHOU: ${e.message}`);
            }
        }
        process.exit(1);
    } catch (err) {
        console.error("ERRO GERAL:", err);
        process.exit(1);
    }
}
list();
