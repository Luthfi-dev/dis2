
import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { offlineStorage } from './offline-storage';

config();

const isOffline = process.env.STATUS_DB === 'offline';

// Konfigurasi DB dikosongkan untuk keamanan
const dbConfig = {
    host: process.env.DB_HOST || '',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || '',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
};

export interface DBInterface {
    query: (sql: string, params?: any[]) => Promise<[any, any]>;
    beginTransaction: () => Promise<void>;
    commit: () => Promise<void>;
    rollback: () => Promise<void>;
    release: () => void;
}

let pool: any = null;

export default async function getDB(): Promise<DBInterface> {
    if (isOffline) {
        return {
            query: async (sql: string, params?: any[]) => {
                const result = await offlineStorage.executeQuery(sql, params);
                return [result, null];
            },
            beginTransaction: async () => {},
            commit: async () => {},
            rollback: async () => {},
            release: () => {} 
        };
    }

    if (!pool) {
        // Jika parameter kosong, mysql2 mungkin melempar error saat pembuatan pool
        // Pastikan env diisi sebelum beralih ke mode online
        pool = mysql.createPool(dbConfig);
    }

    const connection = await pool.getConnection();
    return {
        query: (sql: string, params?: any[]) => connection.query(sql, params),
        beginTransaction: () => connection.beginTransaction(),
        commit: () => connection.commit(),
        rollback: () => connection.rollback(),
        release: () => connection.release()
    };
}
