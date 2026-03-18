require('./config/env');
const db = require('./config/db');

const init = async () => {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS ai_memory (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                key_name VARCHAR(100) NOT NULL,
                value TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY (user_id, key_name)
            )
        `);
        console.log("DATABASE ATLAS INITIALIZED");
        process.exit(0);
    } catch (e) {
        console.error("DB INIT ERROR:", e);
        process.exit(1);
    }
};
init();
