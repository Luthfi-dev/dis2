
import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// This configuration is now a factory function to ensure fresh config for each pool instance.
const dbConfig = {
    host: process.env.DB_HOST || '195.88.211.130',
    user: process.env.DB_USER || 'maudigic_gg',
    password: process.env.DB_PASSWORD || 'B4ru123456_',
    database: process.env.DB_DATABASE || 'maudigic_buku_induk_siswa',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Enable keep-alive packets to prevent timeout issues
    connectTimeout: 20000, 
};

// Create a single, shared pool instance
const pool = mysql.createPool(dbConfig);

// Export the pool directly. It's designed to handle connection management.
export default pool;

