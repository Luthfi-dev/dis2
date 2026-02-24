import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables dari file .env jika ada
config();

/**
 * Konfigurasi database MySQL Remote.
 * Host diperbarui ke IP 103.219.251.163 sesuai instruksi whitelist.
 * Timeout ditingkatkan untuk menangani kendala jaringan remote.
 */
const dbConfig = {
    host: process.env.DB_HOST || '103.219.251.163',
    user: process.env.DB_USER || 'maudigic_gg',
    password: process.env.DB_PASSWORD || 'B4ru123456_',
    database: process.env.DB_DATABASE || 'maudigic_buku_induk_siswa',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000, // Meningkatkan timeout menjadi 60 detik
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
};

// Singleton pool instance
const pool = mysql.createPool(dbConfig);

export default pool;