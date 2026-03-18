const axios = require('axios');

const test = async () => {
    try {
        const bid = 1; // Bancada padrão
        const res = await axios.get(`http://localhost:3001/api/user/sistemas/${bid}`);
        console.log('RES DATA:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('ERROR:', err.message);
    }
};

test();
