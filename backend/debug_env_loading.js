require('dotenv').config();
console.log('--- DEBUG ENV ---');
console.log('Porta:', process.env.PORT);
console.log('DB Host:', process.env.DB_HOST);
console.log('OpenAI Key exists:', !!process.env.OPENAI_API_KEY);
console.log('Gemini Key exists:', !!process.env.GEMINI_API_KEY);
console.log('Keys count:', Object.keys(process.env).filter(k => k.includes('API_KEY')).length);
console.log('-----------------');
