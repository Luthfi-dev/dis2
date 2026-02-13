
import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// This configuration now relies solely on environment variables.
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
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
