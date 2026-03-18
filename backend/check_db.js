const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function check() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });
    const [rows] = await connection.execute('SHOW COLUMNS FROM usuarios');
    console.log(JSON.stringify(rows, null, 2));
    process.exit();
}
check();
