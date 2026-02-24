// File ini adalah pustaka internal, tidak boleh menggunakan 'use server'.
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
            this.cachedData = {
                siswa: this.generateDummySiswa(),
                pegawai: this.generateDummyPegawai(),
                users: [
                    { id: '1', email: 'admin@gmail.com', name: 'Super Admin', role: 'superadmin', status: 'active', password: '$2a$10$K6Z6Y6Z6Y6Z6Y6Z6Y6Z6YuP6Y6Z6Y6Z6Y6Z6Y6Z6Y6Z6Y6Z6Y' }
                ],
                app_settings: [{ id: 1, app_title: 'EduArchive Offline', app_description: 'Mode Offline Aktif' }]
            };
            await this.save();
        }
    }

    private async save() {
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
                if (params[0]) {
                    const search = params[0].replace(/%/g, '').toLowerCase();
                    data = data.filter(s => String(s.siswa_namaLengkap).toLowerCase().includes(search) || String(s.siswa_nisn).includes(search));
                }
                return data;
            }
            if (upperSql.includes('FROM PEGAWAI')) {
                let data = [...this.cachedData!.pegawai];
                if (params[0]) {
                    const search = params[0].replace(/%/g, '').toLowerCase();
                    data = data.filter(p => String(p.pegawai_nama).toLowerCase().includes(search) || String(p.pegawai_nip).includes(search));
                }
                return data;
            }
            if (upperSql.includes('FROM USERS')) {
                if (upperSql.includes('WHERE EMAIL = ?')) {
                    return this.cachedData!.users.filter(u => u.email.toLowerCase() === params[0].toLowerCase());
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
                    try { if(typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) val = JSON.parse(val); } catch(e) {}
                    newData[col] = val;
                });
                (this.cachedData as any)[table].push(newData);
                await this.save();
                await this.logSql(sql, params);
                return { affectedRows: 1, insertId: newId };
            }
        }

        if (upperSql.startsWith('UPDATE')) {
            // Logic update offline sederhana (hanya simpan log SQL)
            await this.save();
            await this.logSql(sql, params);
            return { affectedRows: 1 };
        }

        if (upperSql.startsWith('DELETE')) {
            const table = upperSql.includes('SISWA') ? 'siswa' : (upperSql.includes('PEGAWAI') ? 'pegawai' : 'users');
            const id = params[0];
            (this.cachedData as any)[table] = (this.cachedData as any)[table].filter((item: any) => item.id.toString() !== id.toString());
            await this.save();
            await this.logSql(sql, params);
            return { affectedRows: 1 };
        }

        return [];
    }

    private generateDummySiswa() {
        return [
            { id: '101', siswa_namaLengkap: 'Ahmad Subagja', siswa_nis: '2024001', siswa_nisn: '0012345671', siswa_jenisKelamin: 'Laki-laki', status: 'Lengkap', siswa_tempatLahir: 'Jakarta', siswa_tanggalLahir: '2010-05-15' },
            { id: '102', siswa_namaLengkap: 'Siti Aminah', siswa_nis: '2024002', siswa_nisn: '0012345672', siswa_jenisKelamin: 'Perempuan', status: 'Lengkap', siswa_tempatLahir: 'Bandung', siswa_tanggalLahir: '2010-08-20' }
        ];
    }

    private generateDummyPegawai() {
        return [
            { id: '201', pegawai_nama: 'Drs. Mulyadi, M.Pd.', pegawai_nip: '197501012000031001', pegawai_jabatan: 'Kepala Sekolah', status: 'Lengkap', pegawai_jenisKelamin: 'Laki-laki' },
            { id: '202', pegawai_nama: 'Rina Kartika, S.Pd.', pegawai_nip: '198805122015042002', pegawai_jabatan: 'Guru Matematika', status: 'Lengkap', pegawai_jenisKelamin: 'Perempuan' }
        ];
    }
}

export const offlineStorage = new OfflineStorage();
