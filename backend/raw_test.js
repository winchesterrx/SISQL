const https = require('https');
require('./config/env');

const data = JSON.stringify({
    contents: [{ parts: [{ text: "hi" }] }]
});

const key = process.env.GEMINI_API_KEY;
// Testando 1.5-flash que é o mais comum
const model = "gemini-1.5-flash";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log(`Testando modelo: ${model}`);
const req = https.request(url, options, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`BODY: ${body}`);
        process.exit();
    });
});

req.on('error', (e) => {
    console.error(e);
    process.exit();
});

req.write(data);
req.end();
