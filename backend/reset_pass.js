require('./config/env');
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function resetPassword() {
    try {
        const hash = await bcrypt.hash('123', 10);
        console.log('Novo Hash:', hash);

        // Atualizar todos os usuários para a senha 123 (ou você pode filtrar por e-mail se preferir)
        const [result] = await pool.execute(
            'UPDATE usuarios SET senha = ? WHERE role = "admin" LIMIT 1',
            [hash]
        );

        console.log('Resultado do update:', result);
        process.exit(0);
    } catch (err) {
        console.error('Erro ao resetar senha:', err);
        process.exit(1);
    }
}

resetPassword();
