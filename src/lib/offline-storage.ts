
import fs from 'fs/promises';
import path from 'path';

const STORAGE_PATH = path.join(process.cwd(), 'offline_db_data.json');
const SQL_LOG_PATH = path.join(process.cwd(), 'local_audit_log.sql');

interface StorageSchema {
    siswa: any[];
    pegawai: any[];
    users: any[];
    app_settings: any[];
}

class OfflineStorage {
    private cachedData: StorageSchema | null = null;

    private async init() {
        if (this.cachedData) return;
        try {
            const data = await fs.readFile(STORAGE_PATH, 'utf-8');
            this.cachedData = JSON.parse(data);
        } catch (e) {
            // Revert to minimal structure if file doesn't exist
            this.cachedData = {
                siswa: [],
                pegawai: [],
                users: [
                    { 
                        id: '1', 
                        email: 'superadmin@gmail.com', 
                        name: 'Super Admin', 
                        role: 'superadmin', 
                        status: 'active', 
                        password: '$2a$10$K6Z6Y6Z6Y6Z6Y6Z6Y6Z6YuP6Y6Z6Y6Z6Y6Z6Y6Z6Y6Z6Y6Z6Y' 
                    }
                ],
                app_settings: [{ id: 1, app_title: 'EduArchive Offline', app_description: 'Mode Offline Aktif' }]
            };
            await this.save();
        }
    }

    private async save() {
        if (!this.cachedData) return;
        await fs.writeFile(STORAGE_PATH, JSON.stringify(this.cachedData, null, 2));
    }

    private async logSql(sql: string, params: any[] = []) {
        let finalSql = sql;
        params.forEach(p => {
            const val = typeof p === 'string' ? `'${p.replace(/'/g, "''")}'` : (p === null ? 'NULL' : p);
            finalSql = finalSql.replace('?', String(val));
        });
        await fs.appendFile(SQL_LOG_PATH, `${finalSql};\n`);
    }

    async executeQuery(sql: string, params: any[] = []): Promise<any> {
        await this.init();
        const upperSql = sql.toUpperCase();

        if (upperSql.startsWith('SELECT')) {
            if (upperSql.includes('FROM SISWA')) {
                let data = [...this.cachedData!.siswa];
                if (params[0] && upperSql.includes('LIKE')) {
                    const search = String(params[0]).replace(/%/g, '').toLowerCase();
                    data = data.filter(s => String(s.siswa_namaLengkap).toLowerCase().includes(search) || String(s.siswa_nisn).includes(search));
                }
                if (upperSql.includes('WHERE ID = ?')) {
                    return data.filter(s => s.id.toString() === params[0].toString());
                }
                return data;
            }
            if (upperSql.includes('FROM PEGAWAI')) {
                let data = [...this.cachedData!.pegawai];
                if (params[0] && upperSql.includes('LIKE')) {
                    const search = String(params[0]).replace(/%/g, '').toLowerCase();
                    data = data.filter(p => String(p.pegawai_nama).toLowerCase().includes(search) || String(p.pegawai_nip).includes(search));
                }
                if (upperSql.includes('WHERE ID = ?')) {
                    return data.filter(p => p.id.toString() === params[0].toString());
                }
                return data;
            }
            if (upperSql.includes('FROM USERS')) {
                if (upperSql.includes('WHERE EMAIL = ?')) {
                    return this.cachedData!.users.filter(u => u.email.toLowerCase() === params[0].toLowerCase());
                }
                if (upperSql.includes('WHERE ROLE !=')) {
                    return this.cachedData!.users.filter(u => u.role !== 'superadmin');
                }
                if (upperSql.includes('WHERE ID = ?')) {
                    return this.cachedData!.users.filter(u => u.id.toString() === params[0].toString());
                }
                return this.cachedData!.users;
            }
            if (upperSql.includes('FROM APP_SETTINGS')) return this.cachedData!.app_settings;
        }

        if (upperSql.startsWith('INSERT INTO')) {
            const table = upperSql.includes('SISWA') ? 'siswa' : (upperSql.includes('PEGAWAI') ? 'pegawai' : 'users');
            const newId = Date.now().toString();
            const columnsMatch = sql.match(/\((.*?)\)/);
            if (columnsMatch) {
                const columns = columnsMatch[1].split(',').map(c => c.trim());
                const newData: any = { id: newId };
                columns.forEach((col, idx) => {
                    let val = params[idx];
                    // Logic sinkron: jika params adalah JSON string, parse agar file .json tetap terstruktur
                    try { 
                        if(typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                            val = JSON.parse(val);
                        }
                    } catch(e) {}
                    newData[col] = val;
                });
                (this.cachedData as any)[table].push(newData);
                await this.save();
                await this.logSql(sql, params);
                return { affectedRows: 1, insertId: newId };
            }
        }

        if (upperSql.startsWith('UPDATE')) {
            const table = upperSql.includes('SISWA') ? 'siswa' : (upperSql.includes('PEGAWAI') ? 'pegawai' : (upperSql.includes('USERS') ? 'users' : 'app_settings'));
            
            // Simpulkan update berdasarkan data terbaru (karena ini simulasi offline)
            // Dalam implementasi nyata, kita harus mencari ID di params terakhir
            const id = params[params.length - 1];
            const targetIndex = (this.cachedData as any)[table].findIndex((item: any) => item.id.toString() === id?.toString());
            
            if (targetIndex !== -1) {
                // Ekstrak kolom dari SQL UPDATE table SET col1 = ?, col2 = ? WHERE id = ?
                const setMatch = sql.match(/SET (.*?) WHERE/i);
                if (setMatch) {
                    const sets = setMatch[1].split(',').map(s => s.trim().split('=')[0].trim());
                    sets.forEach((col, idx) => {
                        let val = params[idx];
                        try { 
                            if(typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                                val = JSON.parse(val);
                            }
                        } catch(e) {}
                        (this.cachedData as any)[table][targetIndex][col] = val;
                    });
                } else if (table === 'app_settings') {
                    // Penanganan khusus app_settings (biasanya id=1 fixed)
                    (this.cachedData as any)[table][0].app_title = params[0];
                    (this.cachedData as any)[table][0].app_description = params[1];
                    (this.cachedData as any)[table][0].app_logo_url = params[2];
                }
                
                await this.save();
                await this.logSql(sql, params);
                return { affectedRows: 1 };
            }
        }

        if (upperSql.startsWith('DELETE')) {
            const table = upperSql.includes('SISWA') ? 'siswa' : (upperSql.includes('PEGAWAI') ? 'pegawai' : 'users');
            const id = params[0];
            (this.cachedData as any)[table] = (this.cachedData as any)[table].filter((item: any) => item.id.toString() !== id?.toString());
            await this.save();
            await this.logSql(sql, params);
            return { affectedRows: 1 };
        }

        return [];
    }
}

export const offlineStorage = new OfflineStorage();
