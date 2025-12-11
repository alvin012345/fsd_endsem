const mysql = require('mysql2/promise');

// PASTE YOUR COPIED SERVICE URI HERE
const dbUrl = "mysql://avnadmin:AVNS_8Xagj6qlvXhdpM6ArAB@mysql-19503ac8-grokmemehub.h.aivencloud.com:13797/defaultdb?ssl-mode=REQUIRED";

async function setup() {
    try {
        console.log("Connected! Creating tables...");

        await (await mysql.createConnection(dbUrl)).query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100),
                email VARCHAR(100) UNIQUE,
                password VARCHAR(255),
                location_lat DECIMAL(10,8),
                location_long DECIMAL(11,8)
            )
        `);
        
        await (await mysql.createConnection(dbUrl)).query(`
            CREATE TABLE IF NOT EXISTS memes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255),
                caption TEXT,
                image_url TEXT,
                category VARCHAR(50),
                uploader_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("✅ Tables Created Successfully!");
        process.exit();
    } catch (err) 
    {
        console.error("❌ Error:", err.message);
    }
}
setup();