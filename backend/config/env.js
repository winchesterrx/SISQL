const path = require('path');
const dotenv = require('dotenv');

// Carregando o .env usando o caminho absoluto do diretório 'backend'
const envPath = path.join(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('❌ ERRO AO CARREGAR .ENV:', result.error);
} else {
    console.log('✅ .ENV CARREGADO COM SUCESSO:', Object.keys(result.parsed || {}).length, 'variáveis injetadas.');
}

module.exports = process.env;
