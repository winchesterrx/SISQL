require('./config/env');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { OpenAI } = require('openai');

async function superDiagnose() {
    console.log('=== SUPER DIAGNÓSTICO DE CONEXÃO ===');

    // 1. Verificar Variáveis
    console.log('OpenAI Key:', process.env.OPENAI_API_KEY ? `Presente (${process.env.OPENAI_API_KEY.substring(0, 10)}...)` : 'Faltando');
    console.log('Gemini Key:', process.env.GEMINI_API_KEY ? `Presente (${process.env.GEMINI_API_KEY.substring(0, 10)}...)` : 'Faltando');

    // 2. Teste OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    try {
        console.log('\n--- Testando OpenAI ---');
        const res = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "oi" }],
            max_tokens: 5
        });
        console.log('✅ OpenAI OK:', res.choices[0].message.content);
    } catch (e) {
        console.error('❌ OpenAI FALHOU:', e.message);
    }

    // 3. Teste Gemini (Todos os modelos do print)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelsToTest = [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-pro",
        "gemini-pro"
    ];

    console.log('\n--- Testando Modelos Gemini (um por um) ---');
    for (const m of modelsToTest) {
        try {
            process.stdout.write(`Testando ${m}... `);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("responda 'ok'");
            const response = await result.response;
            console.log(`✅ OK: ${response.text().trim()}`);
        } catch (e) {
            console.log(`❌ ERRO: ${e.message}`);
        }
    }

    process.exit();
}

superDiagnose();
