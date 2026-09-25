import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json({ limit: '50mb' }));

// Konfigurasi Database MySQL (Menggunakan Pool agar stabil di Vercel Serverless)
const db = mysql.createPool({
    host: process.env.DB_HOST || 'kai-monitoring-db-alghi6084-7e6c.d.aivencloud.com',   
    port: process.env.DB_PORT || 24664,   
    user: process.env.DB_USER || 'avnadmin',
    password: process.env.DB_PASSWORD || 'AVNS_aSxvHfXVWPBh1ubAG6o',
    database: process.env.DB_NAME || 'defaultdb',
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Otomatis buat tabel users jika belum ada
db.query(`
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`);

// Otomatis buat tabel history jika belum ada
db.query(`
    CREATE TABLE IF NOT EXISTS history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(20) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        payload LONGTEXT NOT NULL,
        uploaded_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`);

// Masukkan akun admin default jika belum ada
db.query(`
    INSERT IGNORE INTO users (name, username, password, role) 
    VALUES ('Administrator', 'admin', 'admin123', 'admin');
`);

/* ==============================================
   API ENDPOINTS (JALUR KOMUNIKASI)
============================================== */

// 1. API Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT id, name, username, role FROM users WHERE username = ? AND password = ?';
    
    db.query(query, [username, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length > 0) {
            res.json({ success: true, user: results[0] });
        } else {
            res.status(401).json({ success: false, message: 'Username atau password salah' });
        }
    });
});

// 2. API Ambil Data Riwayat (GET)
app.get('/api/history', (req, res) => {
    const query = 'SELECT * FROM history ORDER BY created_at DESC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const formattedResults = results.map(row => ({
            id: row.id,
            type: row.type,
            fileName: row.file_name,
            payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
            uploadedBy: row.uploaded_by,
            timestamp: row.created_at
        }));
        res.json(formattedResults);
    });
});

// 3. API Simpan Data Riwayat Baru (POST)
app.post('/api/history', (req, res) => {
    const { type, fileName, payload, uploadedBy } = req.body;
    const query = 'INSERT INTO history (type, file_name, payload, uploaded_by) VALUES (?, ?, ?, ?)';
    
    db.query(query, [type, fileName, JSON.stringify(payload), uploadedBy], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Data berhasil disimpan', id: result.insertId });
    });
});

// 4. API Hapus Riwayat (DELETE)
app.delete('/api/history/:id', (req, res) => {
    db.query('DELETE FROM history WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// 5. API Manajemen User (GET - Ambil Semua User)
app.get('/api/users', (req, res) => {
    db.query('SELECT id, name, username, role FROM users ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 6. API Manajemen User (POST - Tambah User Baru)
app.post('/api/users', (req, res) => {
    const { name, username, password, role } = req.body;
    const query = 'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)';
    db.query(query, [name, username, password, role], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// 7. API Manajemen User (DELETE - Hapus User)
app.delete('/api/users/:id', (req, res) => {
    db.query('DELETE FROM users WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// EKSPOR APLIKASI UNTUK VERCEL (Gaya Modern)
export default app;
