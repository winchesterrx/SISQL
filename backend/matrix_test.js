const https = require('https');
require('./config/env');

async function test(version, model) {
    return new Promise((resolve) => {
        const data = JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] });
        const key = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${key}`;

        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
        };

        const req = https.request(url, options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                resolve({ version, model, status: res.statusCode, body: body.substring(0, 100) });
            });
        });
        req.on('error', (e) => resolve({ version, model, status: 'ERR', body: e.message }));
        req.write(data);
        req.end();
    });
}

async function run() {
    const versions = ['v1', 'v1beta'];
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro'];

    for (const v of versions) {
        for (const m of models) {
            const res = await test(v, m);
            console.log(`${res.version} | ${res.model} | STATUS: ${res.status}`);
        }
    }
    process.exit();
}

run();
