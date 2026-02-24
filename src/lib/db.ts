// Pustaka internal database, tidak boleh 'use server'.
import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { offlineStorage } from './offline-storage';

config();

const isOffline = process.env.STATUS_DB === 'offline';

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
