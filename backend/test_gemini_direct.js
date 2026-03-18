require('./config/env');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    console.log('--- TESTE DIRETO GEMINI ---');
    console.log('Key:', process.env.GEMINI_API_KEY ? 'Presente' : 'AUSENTE');

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Olá, responda apenas 'OK' se estiver funcionando.");
        const response = await result.response;
        console.log('Resposta:', response.text());
        console.log('✅ SUCESSO NO TESTE DIRETO');
    } catch (err) {
        console.error('❌ ERRO NO TESTE DIRETO:', err);
    }
}

testGemini();
