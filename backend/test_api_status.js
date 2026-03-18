require('./config/env');
const jwt = require('jsonwebtoken');
const axios = require('axios');

async function testStatus() {
    const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET);
    console.log('Token gerado para Admin ID 1.');

    try {
        const res = await axios.get('http://localhost:3001/api/admin/status', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Resposta status:', JSON.stringify(res.data));
    } catch (e) {
        console.error('Falha ao chamar status:', e.message);
        if (e.response) console.error('Status:', e.response.status, 'Data:', e.response.data);
    }

    try {
        const res = await axios.get('http://localhost:3001/api/user/sistemas/1', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Resposta sistemas (Bancada 1):', JSON.stringify(res.data));
    } catch (e) {
        console.error('Falha ao chamar sistemas:', e.message);
    }
}

testStatus();
