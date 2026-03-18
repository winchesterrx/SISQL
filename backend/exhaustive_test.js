const https = require('https');
require('./config/env');

async function test(version, model) {
    return new Promise((resolve) => {
        const data = JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] });
        const key = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${key}`;
        const options = { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } };
        const req = https.request(url, options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => resolve({ version, model, status: res.statusCode }));
        });
        req.on('error', () => resolve({ version, model, status: 'ERR' }));
        req.write(data);
        req.end();
    });
}

async function run() {
    const versions = ['v1', 'v1beta'];
    // Adicionando -001 e -002 que são comuns em projetos antigos
    const models = [
        'gemini-1.5-flash', 'gemini-1.5-flash-001', 'gemini-1.5-flash-002',
        'gemini-1.5-pro', 'gemini-1.5-pro-001',
        'gemini-pro', 'gemini-1.0-pro', 'gemini-1.0-pro-001'
    ];

    console.log('--- RESULTADOS 200 OK ---');
    for (const v of versions) {
        for (const m of models) {
            const res = await test(v, m);
            if (res.status === 200) {
                console.log(`✅ ${res.version} | ${res.model}`);
            } else {
                console.log(`❌ ${res.version} | ${res.model} (${res.status})`);
            }
        }
    }
    process.exit();
}
run();
