const https = require('https');
require('./config/env');

async function listAll() {
    return new Promise((resolve) => {
        const key = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

        https.get(url, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                console.log(`STATUS: ${res.statusCode}`);
                try {
                    const data = JSON.parse(body);
                    if (data.models) {
                        data.models.forEach(m => console.log(`MODAL: ${m.name}`));
                    } else {
                        console.log('Nenhum modelo retornado ou erro no JSON.');
                        console.log(JSON.stringify(data, null, 2));
                    }
                } catch (e) {
                    console.log('Erro ao parsear JSON:', body);
                }
                process.exit();
            });
        });
    });
}

listAll();
