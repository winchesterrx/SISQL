require('./config/env');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function quickDiagnose() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.0-flash-lite", "gemini-1.5-pro", "gemini-pro"];

    for (const m of models) {
        try {
            const model = genAI.getGenerativeModel({ model: m });
            await model.generateContent("hi");
            console.log(`${m}: OK`);
        } catch (e) {
            // Pegar apenas a primeira linha do erro para não truncar
            const msg = e.message.split('\n')[0];
            console.log(`${m}: FAIL -> ${msg}`);
        }
    }
    process.exit();
}

quickDiagnose();
