const https = require('https');
require('./config/env');

async function listAll() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    https.get(url, (res) => {
        let body = '';
        res.on('data', (d) => body += d);
        res.on('end', () => {
            const data = JSON.parse(body);
            if (data.models) {
                const names = data.models.map(m => m.name.replace('models/', ''));
                console.log('MODELOS: ' + names.join(', '));
            } else {
                console.log('ERRO: ' + body);
            }
            process.exit();
        });
    });
}
listAll();
