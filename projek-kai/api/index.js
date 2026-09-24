const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Konfigurasi Database Aiven via Environment Variables
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
});

// Contoh Route API
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend KAI Operational' });
});

// Export handler untuk Vercel Serverless Function
module.exports = app;