const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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
const SECRET_KEY = "exam_secret";

// --- SETUP ROUTE (Creates ALL Tables) ---
app.get('/setup', async (req, res) => {
    try {
        const conn = await mysql.createConnection(DB_CONFIG);
        await conn.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100),
                email VARCHAR(100) UNIQUE,
                password VARCHAR(255),
                location_lat DECIMAL(10,8),
                location_long DECIMAL(11,8),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await conn.query(`
            CREATE TABLE IF NOT EXISTS memes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255),
                caption TEXT,
                image_url TEXT,
                category VARCHAR(50),
                uploader_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (uploader_id) REFERENCES users(id)
            )
        `);
        // NEW: Reactions Table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS reactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                meme_id INT,
                user_id INT,
                reaction_type VARCHAR(20),
                FOREIGN KEY (meme_id) REFERENCES memes(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);
        res.send("✅ ALL TABLES CREATED (Users, Memes, Reactions)!");
    } catch (err) { res.status(500).send("❌ Setup Failed: " + err.message); }
});

// --- AUTH ROUTES ---
app.post('/api/register', async (req, res) => {
    const { username, email, password, lat, long } = req.body;
    const hash = await bcrypt.hash(password, 10);
    try {
        await pool.query('INSERT INTO users (username, email, password, location_lat, location_long) VALUES (?, ?, ?, ?, ?)', [username, email, hash, lat, long]);
        res.json({ message: "User registered!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0 || !(await bcrypt.compare(password, users[0].password))) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: users[0].id, username: users[0].username }, SECRET_KEY);
    res.json({ token, username: users[0].username, id: users[0].id });
});

// --- MEME ROUTES ---
app.get('/api/memes', async (req, res) => {
    const { search, sort } = req.query;
    let query = `
        SELECT memes.*, users.username, 
        (SELECT COUNT(*) FROM reactions WHERE reactions.meme_id = memes.id) as reaction_count 
        FROM memes JOIN users ON memes.uploader_id = users.id
    `;
    
    if (search) query += ` WHERE title LIKE '%${search}%' OR caption LIKE '%${search}%'`;
    if (sort === 'trending') query += ` ORDER BY reaction_count DESC`;
    else query += ` ORDER BY created_at DESC`;

    const [rows] = await pool.query(query);
    res.json(rows);
});

app.post('/api/memes', async (req, res) => {
    const { title, caption, image_url, category, token } = req.body;
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        await pool.query('INSERT INTO memes (title, caption, image_url, category, uploader_id) VALUES (?, ?, ?, ?, ?)', [title, caption, image_url, category, decoded.id]);
        res.json({ message: "Meme Uploaded!" });
    } catch (err) { res.status(401).json({ error: "Unauthorized" }); }
});

// --- REACTION ROUTES ---
app.post('/api/reactions', async (req, res) => {
    const { meme_id, type, token } = req.body; // type = 'laugh', 'robot', etc.
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        await pool.query('INSERT INTO reactions (meme_id, user_id, reaction_type) VALUES (?, ?, ?)', [meme_id, decoded.id, type]);
        res.json({ message: "Reacted!" });
    } catch (err) { res.status(401).json({ error: "Unauthorized" }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));