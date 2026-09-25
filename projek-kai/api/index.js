import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';

const app = express();

app.use(cors()); 
app.use(express.json({ limit: '50mb' }));

const db = mysql.createPool({
    host: 'kai-monitoring-db-alghi6084-7e6c.d.aivencloud.com',   
    port: 24664,   
    user: 'avnadmin',
    password: 'AVNS_aSxvHfXVWPBh1ubAG6o',
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 20000 
});

/* ==============================================
   API ENDPOINTS 
============================================== */

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

app.post('/api/history', (req, res) => {
    const { type, fileName, payload, uploadedBy } = req.body;
    const query = 'INSERT INTO history (type, file_name, payload, uploaded_by) VALUES (?, ?, ?, ?)';
    
    db.query(query, [type, fileName, JSON.stringify(payload), uploadedBy], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Data berhasil disimpan', id: result.insertId });
    });
});

app.delete('/api/history/:id', (req, res) => {
    db.query('DELETE FROM history WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.get('/api/users', (req, res) => {
    db.query('SELECT id, name, username, role FROM users ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/users', (req, res) => {
    const { name, username, password, role } = req.body;
    const query = 'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)';
    db.query(query, [name, username, password, role], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/users/:id', (req, res) => {
    db.query('DELETE FROM users WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

export default app;
