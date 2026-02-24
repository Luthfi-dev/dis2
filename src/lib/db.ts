
import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables dari file .env jika ada
config();

/**
 * Konfigurasi database MySQL Remote.
 * Pastikan IP 195.88.211.130 telah mengizinkan koneksi (whitelisting) 
 * dari lingkungan tempat aplikasi ini dijalankan.
 */
const dbConfig = {
    host: process.env.DB_HOST || '195.88.211.130',
    user: process.env.DB_USER || 'maudigic_gg',
    password: process.env.DB_PASSWORD || 'B4ru123456_',
    database: process.env.DB_DATABASE || 'maudigic_buku_induk_siswa',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 30000, // Menambah timeout ke 30 detik
    enableKeepAlive: true, // Menjaga koneksi tetap hidup
    keepAliveInitialDelay: 10000,
};

// Singleton pool instance
const pool = mysql.createPool(dbConfig);

export default pool;
