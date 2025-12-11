const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

const DB_CONFIG = {
    host: 'mysql-19503ac8-grokmemehub.h.aivencloud.com',
    port: 13797,
    user: 'avnadmin',
    password: 'AVNS_8Xagj6qlvXhdpM6ArAB', 
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
};

const pool = mysql.createPool(DB_CONFIG);

app.get('/setup', async (req, res) => {
    try {
        const conn = await mysql.createConnection(DB_CONFIG);
        await conn.query(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(100), email VARCHAR(100) UNIQUE, password VARCHAR(255), location_lat DECIMAL(10,8), location_long DECIMAL(11,8))`);
        await conn.query(`CREATE TABLE IF NOT EXISTS memes (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), caption TEXT, image_url TEXT, category VARCHAR(50), uploader_id INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        res.send("✅ DATABASE SETUP COMPLETE!");
    } catch (err) { res.send("❌ Error: " + err.message); }
});

app.get('/', (req, res) => res.send('Backend Live!'));
app.get('/api/memes', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM memes');
    res.json(rows);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));