import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Konfigurasi database MySQL Remote Baru.
 */
const dbConfig = {
    host: process.env.DB_HOST || '41.216.185.84',
    user: process.env.DB_USER || 'smpnbire_adm',
    password: process.env.DB_PASSWORD || 'S1m1n123456_',
    database: process.env.DB_DATABASE || 'smpnbire_siemins',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
};

// Singleton pool instance
const pool = mysql.createPool(dbConfig);

export default pool;
