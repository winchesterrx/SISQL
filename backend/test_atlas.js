const fs = require('fs');
require('dotenv').config();
const jwt = require('jsonwebtoken');

async function run() {
    try {
        const token = jwt.sign(
            { id: 1, nome: 'Admin', role: 'admin', bancada_id: null },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        const chatRes = await fetch('http://localhost:3001/api/atlas/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message: 'Oi ATLAS', history: [] })
        });

        const data = await chatRes.json();
        fs.writeFileSync('atlas_response.json', JSON.stringify(data, null, 2), 'utf-8');
        console.log("Response written to atlas_response.json");
    } catch (err) {
        console.error('ERRO:', err.message);
    }
}
run();
