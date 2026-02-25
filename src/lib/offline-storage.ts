import fs from 'fs/promises';
import path from 'path';

const STORAGE_PATH = path.join(process.cwd(), 'offline_db_data.json');
const SQL_LOG_PATH = path.join(process.cwd(), 'local_audit_log.sql');

interface StorageSchema {
    siswa: any[];
    pegawai: any[];
    users: any[];
    app_settings: any[];
    provinsi: any[];
    kabupaten: any[];
    kecamatan: any[];
    desa: any[];
}

class OfflineStorage {
    private cachedData: StorageSchema | null = null;

    private async init() {
        if (this.cachedData) return;
        try {
            const data = await fs.readFile(STORAGE_PATH, 'utf-8');
            this.cachedData = JSON.parse(data);
        } catch (e) {
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
                        password: '$2a$10$6K68kxFjrP0TdPta2q4Z.ub0liE1IB1dU5kCTR1Z77Bqj2AtSSrP6' 
                    },
                    { 
                        id: '2', 
                        email: 'admin@gmail.com', 
                        name: 'Admin Sekolah', 
                        role: 'admin', 
                        status: 'active', 
                        password: '$2a$10$6K68kxFjrP0TdPta2q4Z.ub0liE1IB1dU5kCTR1Z77Bqj2AtSSrP6' 
                    }
                ],
                app_settings: [{ id: 1, app_title: 'EduArchive Offline', app_description: 'Mode Offline Aktif - Audit Terverifikasi', app_logo_url: '' }],
                provinsi: [{ id: '11', name: 'ACEH' }, { id: '32', name: 'JAWA BARAT' }],
                kabupaten: [{ id: '1111', name: 'KABUPATEN BIREUEN', province_id: '11' }, { id: '3273', name: 'KOTA BANDUNG', province_id: '32' }],
                kecamatan: [{ id: '1111010', name: 'KOTA JUANG', regency_id: '1111' }, { id: '3273010', name: 'ANDIR', regency_id: '3273' }],
                desa: [{ id: '1111010001', name: 'BANDAR BIREUEN', district_id: '1111010' }, { id: '3273010001', name: 'CAMPAKA', district_id: '3273010' }]
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
        try {
            await fs.appendFile(SQL_LOG_PATH, `${finalSql};\n`);
        } catch (e) {
            console.error("Failed to write SQL log:", e);
        }
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
                    return data.filter(s => s.id.toString() === params[0]?.toString());
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
                    return data.filter(p => p.id.toString() === params[0]?.toString());
                }
                return data;
            }
            if (upperSql.includes('FROM USERS')) {
                if (upperSql.includes('WHERE EMAIL = ?')) {
                    return this.cachedData!.users.filter(u => u.email.toLowerCase() === params[0]?.toLowerCase());
                }
                if (upperSql.includes('WHERE ROLE !=')) {
                    return this.cachedData!.users.filter(u => u.role !== 'superadmin');
                }
                if (upperSql.includes('WHERE ID = ?')) {
                    return this.cachedData!.users.filter(u => u.id.toString() === params[0]?.toString());
                }
                return this.cachedData!.users;
            }
            if (upperSql.includes('FROM APP_SETTINGS')) return this.cachedData!.app_settings;
            
            if (upperSql.includes('FROM PROVINSI')) {
                if (upperSql.includes('WHERE ID = ?')) return this.cachedData!.provinsi.filter(p => p.id === params[0]);
                return this.cachedData!.provinsi;
            }
            if (upperSql.includes('FROM KABUPATEN')) {
                if (upperSql.includes('WHERE PROVINCE_ID = ?')) return this.cachedData!.kabupaten.filter(k => k.province_id === params[0]);
                if (upperSql.includes('WHERE ID = ?')) return this.cachedData!.kabupaten.filter(k => k.id === params[0]);
                return this.cachedData!.kabupaten;
            }
            if (upperSql.includes('FROM KECAMATAN')) {
                if (upperSql.includes('WHERE REGENCY_ID = ?')) return this.cachedData!.kecamatan.filter(k => k.regency_id === params[0]);
                if (upperSql.includes('WHERE ID = ?')) return this.cachedData!.kecamatan.filter(k => k.id === params[0]);
                return this.cachedData!.kecamatan;
            }
            if (upperSql.includes('FROM DESA')) {
                if (upperSql.includes('WHERE DISTRICT_ID = ?')) return this.cachedData!.desa.filter(d => d.district_id === params[0]);
                if (upperSql.includes('WHERE ID = ?')) return this.cachedData!.desa.filter(d => d.id === params[0]);
                return this.cachedData!.desa;
            }

            return [];
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
            const id = params[params.length - 1];
            const targetIndex = (this.cachedData as any)[table].findIndex((item: any) => item.id.toString() === id?.toString());
            
            if (targetIndex !== -1) {
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