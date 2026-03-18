const http = require('http');
require('./config/env');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET || 'sissql_master_key_2024');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/admin/status',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer ' + token
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('BODY:', data);
        process.exit();
    });
});

req.on('error', (e) => {
    console.error('ERRO:', e.message);
    process.exit();
});

req.end();
