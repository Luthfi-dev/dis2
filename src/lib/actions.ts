
'use server';

import type { Siswa } from './data';
import type { Pegawai } from './pegawai-data';
import { sanitizeAndFormatData } from './utils';
import type { PegawaiFormData } from '@/lib/pegawai-data';
import type { StudentFormData } from '@/lib/student-data-t';
import pool from './db';
import { omit, isEmpty } from 'lodash';
import Excel from 'exceljs';

// Helper function to parse JSON fields safely
function parseJsonFields(row: any) {
    if (!row) return null;
    const parsedRow = { ...row };
    for (const key in parsedRow) {
        if (typeof parsedRow[key] === 'string') {
            try {
                if (parsedRow[key].startsWith('{') || parsedRow[key].startsWith('[')) {
                    parsedRow[key] = JSON.parse(parsedRow[key]);
                }
            } catch (e) {
                // Not a JSON string, leave it as is
            }
        }
    }
    return parsedRow;
}


// --- Public-facing Server Actions ---

// SISWA ACTIONS
export async function getSiswa(searchTerm?: string): Promise<Siswa[]> {
    const db = await pool.getConnection();
    try {
        let query = 'SELECT * FROM siswa';
        const params: string[] = [];

        if (searchTerm) {
            query += ' WHERE siswa_namaLengkap LIKE ? OR siswa_nisn LIKE ?';
            params.push(`%${searchTerm}%`, `%${searchTerm}%`);
        }

        query += ' ORDER BY id DESC';

        const [rows] = await db.query(query, params);
        return (rows as Siswa[]).map(parseJsonFields);
    } finally {
        db.release();
    }
}

export async function getSiswaById(id: string): Promise<Siswa | null> {
    const db = await pool.getConnection();
    try {
        const [rows] = await db.query('SELECT * FROM siswa WHERE id = ?', [id]);
        return parseJsonFields((rows as Siswa[])[0] || null);
    } finally {
        db.release();
    }
}

export async function deleteSiswa(id: string): Promise<{ success: boolean; message: string }> {
    const db = await pool.getConnection();
    try {
      const [result]:any = await db.query('DELETE FROM siswa WHERE id = ?', [id]);
      if (result.affectedRows > 0) {
          const message = `Data siswa berhasil dihapus.`;
          return { success: true, message };
      }
      return { success: false, message: 'Gagal menghapus data siswa.' };
    } catch (error: any) {
        return { success: false, message: `Gagal menghapus data siswa: ${error.message}` };
    } finally {
        db.release();
    }
}

export async function submitStudentData(data: StudentFormData, studentId?: string) {
    const db = await pool.getConnection();
    try {
        // Cek duplikat hanya jika NIS atau NISN diisi
        if (data.siswa_nis || data.siswa_nisn) {
            const conditions = [];
            const params = [];
            if (data.siswa_nis) {
                conditions.push('siswa_nis = ?');
                params.push(data.siswa_nis);
            }
            if (data.siswa_nisn) {
                conditions.push('siswa_nisn = ?');
                params.push(data.siswa_nisn);
            }

            if (conditions.length > 0) {
                let checkQuery = `SELECT id FROM siswa WHERE (${conditions.join(' OR ')})`;
                const [existing]: any = await db.query(checkQuery, params);

                if (existing.length > 0) {
                     if (!studentId || existing.some((s: {id: any}) => s.id.toString() !== studentId.toString())) {
                        return { success: false, message: 'NIS atau NISN sudah terdaftar untuk siswa lain.' };
                    }
                }
            }
        }
        
        await db.beginTransaction();
        const dataForDb = sanitizeAndFormatData(data);
        
        const requiredFields = [
            'siswa_namaLengkap', 'siswa_nis', 'siswa_nisn', 'siswa_jenisKelamin',
            'siswa_tempatLahir', 'siswa_tanggalLahir', 'siswa_agama', 'siswa_kewarganegaraan',
            'siswa_alamatKkProvinsi', 'siswa_alamatKkKabupaten', 'siswa_alamatKkKecamatan', 'siswa_alamatKkDesa',
            'siswa_domisiliProvinsi', 'siswa_domisiliKabupaten', 'siswa_domisiliKecamatan', 'siswa_domisiliDesa'
        ];
        
        const isComplete = requiredFields.every(field => {
            const value = dataForDb[field];
            return value !== null && value !== undefined && value !== '';
        });

        dataForDb.status = isComplete ? 'Lengkap' : 'Belum Lengkap';
        
        const finalData = Object.fromEntries(
            Object.entries(dataForDb).filter(([_, v]) => v !== null && v !== undefined && v !== '')
        );

        if (studentId) {
            const updateData = omit(finalData, ['id', 'created_at', 'updated_at']);
             if (isEmpty(updateData)) {
                await db.commit();
                return { success: true, message: 'Tidak ada perubahan untuk disimpan.' };
            }
            const fields = Object.keys(updateData).map(f => `${f} = ?`).join(', ');
            const values = Object.values(updateData);
            if (fields.length > 0) {
                 const sql = `UPDATE siswa SET ${fields} WHERE id = ?`;
                 await db.query(sql, [...values, studentId]);
            }
        } else {
             const insertData = omit(finalData, ['id', 'created_at', 'updated_at']);
             if (isEmpty(insertData)) {
                 await db.commit();
                 return { success: false, message: 'Tidak ada data untuk disimpan.' };
             }
             const fields = Object.keys(insertData);
             const values = fields.map(key => insertData[key]);
             const placeholders = fields.map(() => '?').join(', ');
             if (fields.length > 0) {
                const sql = `INSERT INTO siswa (${fields.join(', ')}) VALUES (${placeholders})`;
                await db.query(sql, values);
             }
        }
        
        await db.commit();
        const message = `Data siswa ${data.siswa_namaLengkap} berhasil ${studentId ? 'diperbarui' : 'disimpan'}!`;
        return { success: true, message };

    } catch (error: any) {
        await db.rollback();
        console.error("Student submission server error:", error);
        return { success: false, message: `Gagal menyimpan data siswa karena kesalahan server: ${error.message}` };
    } finally {
        db.release();
    }
}


// PEGAWAI ACTIONS
export async function getPegawai(searchTerm?: string): Promise<Pegawai[]> {
    const db = await pool.getConnection();
    try {
        let query = 'SELECT * FROM pegawai';
        const params: string[] = [];

        if (searchTerm) {
            query += ' WHERE pegawai_nama LIKE ? OR pegawai_nip LIKE ?';
            params.push(`%${searchTerm}%`, `%${searchTerm}%`);
        }

        query += ' ORDER BY id DESC';

        const [rows] = await db.query(query, params);
        return (rows as Pegawai[]).map(parseJsonFields);
    } finally {
        db.release();
    }
}

export async function getPegawaiById(id: string): Promise<Pegawai | null> {
    const db = await pool.getConnection();
    try {
        const [rows] = await db.query('SELECT * FROM pegawai WHERE id = ?', [id]);
        return parseJsonFields((rows as Pegawai[])[0] || null);
    } finally {
        db.release();
    }
}

export async function deletePegawai(id: string): Promise<{ success: boolean; message: string }> {
     const db = await pool.getConnection();
     try {
        const [result]:any = await db.query('DELETE FROM pegawai WHERE id = ?', [id]);
        if (result.affectedRows > 0) {
            const message = `Data pegawai berhasil dihapus.`;
            return { success: true, message };
        }
        return { success: false, message: 'Gagal menghapus data pegawai.' };
    } catch (error: any) {
        return { success: false, message: `Gagal menghapus data pegawai: ${error.message}` };
    } finally {
        db.release();
    }
}

export async function submitPegawaiData(data: PegawaiFormData, pegawaiId?: string) {
    const db = await pool.getConnection();
    try {
        if (data.pegawai_nip) {
            const checkQuery = 'SELECT id FROM pegawai WHERE pegawai_nip = ?';
            const params = [data.pegawai_nip];

            const [existing]: any = await db.query(checkQuery, params);
            if (existing.length > 0) {
                if (!pegawaiId || existing[0].id.toString() !== pegawaiId.toString()) {
                    return { success: false, message: 'NIP sudah terdaftar untuk pegawai lain.' };
                }
            }
        }

        await db.beginTransaction();
        const dataForDb = sanitizeAndFormatData(data);
        
        const requiredFields = [
            'pegawai_nama', 'pegawai_jenisKelamin', 'pegawai_tempatLahir', 'pegawai_tanggalLahir',
            'pegawai_statusPerkawinan', 'pegawai_jabatan', 'pegawai_terhitungMulaiTanggal',
            'pegawai_nip',
            'pegawai_alamatKabupaten', 'pegawai_alamatKecamatan', 'pegawai_alamatDesa',
        ];

        const isComplete = requiredFields.every(field => {
            const value = dataForDb[field];
            return value !== null && value !== undefined && value !== '';
        });
        
        dataForDb.status = isComplete ? 'Lengkap' : 'Belum Lengkap';
        
        const finalData = Object.fromEntries(
            Object.entries(dataForDb).filter(([_, v]) => v !== null && v !== undefined && v !== '')
        );

        if (pegawaiId) {
            const updateData = omit(finalData, ['id', 'created_at', 'updated_at']);
            if (isEmpty(updateData)) {
                await db.commit();
                return { success: true, message: 'Tidak ada perubahan untuk disimpan.' };
            }
            const fields = Object.keys(updateData).map(f => `${f} = ?`).join(', ');
            const values = Object.values(updateData);
            if (fields.length > 0) {
                 const sql = `UPDATE pegawai SET ${fields} WHERE id = ?`;
                 await db.query(sql, [...values, pegawaiId]);
            }
        } else {
             const insertData = omit(finalData, ['id', 'created_at', 'updated_at']);
             if (isEmpty(insertData)) {
                 await db.commit();
                 return { success: false, message: 'Tidak ada data untuk disimpan.' };
             }
             const fields = Object.keys(insertData);
             const values = fields.map(key => insertData[key]);
             const placeholders = fields.map(() => '?').join(', ');
            
             if (fields.length > 0) {
                const sql = `INSERT INTO pegawai (${fields.join(', ')}) VALUES (${placeholders})`;
                await db.query(sql, values);
             }
        }
        
        await db.commit();
        const message = `Data pegawai ${data.pegawai_nama} berhasil ${pegawaiId ? 'diperbarui' : 'disimpan'}!`;
        return { success: true, message };

    } catch (error: any) {
        await db.rollback();
        console.error("Pegawai submission server error:", error);
        return { success: false, message: `Gagal menyimpan data pegawai karena kesalahan server: ${error.message}` };
    } finally {
        db.release();
    }
}


// --- APP SETTINGS ACTIONS ---

export type AppSettings = {
  app_title?: string;
  app_description?: string;
  app_logo_url?: string;
};

export async function getAppSettings(): Promise<AppSettings> {
    const db = await pool.getConnection();
    try {
        const [rows] = await db.query('SELECT app_title, app_description, app_logo_url FROM app_settings WHERE id = 1');
        const settings = (rows as AppSettings[])[0];
        return settings || { app_title: 'EduArchive', app_description: 'Aplikasi Buku Induk Siswa Digital' };
    } catch(e) {
        console.error("Could not get app settings, returning default.", e);
        return { app_title: 'EduArchive', app_description: 'Aplikasi Buku Induk Siswa Digital' };
    } finally {
        db.release();
    }
}

export async function saveAppSettings(data: AppSettings): Promise<{ success: boolean; message: string }> {
    const db = await pool.getConnection();
    try {
        const { app_title, app_description, app_logo_url } = data;
        await db.query(
            'UPDATE app_settings SET app_title = ?, app_description = ?, app_logo_url = ? WHERE id = 1',
            [app_title, app_description, app_logo_url]
        );
        return { success: true, message: 'Pengaturan aplikasi berhasil disimpan.' };
    } catch (error: any) {
        console.error("Error saving app settings:", error);
        return { success: false, message: `Gagal menyimpan pengaturan: ${error.message}` };
    } finally {
        db.release();
    }
}

// --- IMPORT ACTIONS ---
export type ImportResult = {
    success: boolean;
    message: string;
    totalRows: number;
    successCount: number;
    failureCount: number;
    errors: { row: number, reason: string }[];
};

export async function importData(type: 'siswa' | 'pegawai', fileBase64: string): Promise<ImportResult> {
    const db = await pool.getConnection();
    const workbook = new Excel.Workbook();
    const fileBuffer = Buffer.from(fileBase64, 'base64');
    await workbook.xlsx.load(fileBuffer);
    const worksheet = workbook.worksheets[0];

    const results: ImportResult = {
        success: true,
        message: 'Impor selesai.',
        totalRows: worksheet.rowCount - 1,
        successCount: 0,
        failureCount: 0,
        errors: [],
    };

    const headerRow = worksheet.getRow(1);
    
    // Map header names to column keys
    const headerToKeyMap: { [key: string]: string } = {};
    const headerConfigs = type === 'siswa' ? siswaHeaders : pegawaiHeaders;
    
    headerRow.eachCell((cell, colNumber) => {
        const headerText = cell.text;
        const foundHeader = headerConfigs.find(h => h.header === headerText);
        if (foundHeader) {
            headerToKeyMap[colNumber] = foundHeader.key;
        }
    });

    for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        const rowData: any = {};
        let hasData = false;
        
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const key = headerToKeyMap[colNumber];
            if (key) {
                let cellValue = null;
                if (cell.value && typeof cell.value === 'object' && 'result' in cell.value!) {
                     cellValue = (cell.value as any).result;
                } else {
                     cellValue = cell.value;
                }
                
                if (cellValue !== null && cellValue !== undefined) {
                    rowData[key] = cellValue;
                    hasData = true;
                }
            }
        });

        if (!hasData) continue; // Skip empty rows

        try {
            if (type === 'siswa') {
                 if (!rowData.siswa_namaLengkap) throw new Error('Nama Lengkap wajib diisi.');
                 if (!rowData.siswa_nis) throw new Error('NIS wajib diisi.');
                 if (!rowData.siswa_nisn) throw new Error('NISN wajib diisi.');

                const [existing]: any = await db.query(
                    'SELECT id FROM siswa WHERE siswa_nis = ? OR siswa_nisn = ?',
                    [rowData.siswa_nis, rowData.siswa_nisn]
                );
                if (existing.length > 0) {
                    throw new Error(`NIS (${rowData.siswa_nis}) atau NISN (${rowData.siswa_nisn}) sudah ada.`);
                }
                await submitStudentData(rowData);
            } else if (type === 'pegawai') {
                 if (!rowData.pegawai_nama) throw new Error('Nama Lengkap wajib diisi.');
                 if (!rowData.pegawai_nip) throw new Error('NIP wajib diisi.');
                
                const [existing]: any = await db.query(
                    'SELECT id FROM pegawai WHERE pegawai_nip = ?',
                    [rowData.pegawai_nip]
                );
                if (existing.length > 0) {
                    throw new Error(`NIP ${rowData.pegawai_nip} sudah ada.`);
                }
                await submitPegawaiData(rowData);
            }
            results.successCount++;
        } catch (e: any) {
            results.failureCount++;
            results.errors.push({ row: i, reason: e.message || 'Error tidak diketahui' });
        }
    }
    
    db.release();

    if(results.failureCount > 0) {
        results.success = false;
        results.message = `Impor selesai dengan ${results.failureCount} error.`
    } else {
        results.message = `Berhasil mengimpor ${results.successCount} data.`
    }

    return results;
}

const siswaHeaders = [
    { header: 'Nama Lengkap (Wajib)', key: 'siswa_namaLengkap' },
    { header: 'NIS (Wajib)', key: 'siswa_nis' },
    { header: 'NISN (Wajib)', key: 'siswa_nisn' },
    { header: 'Jenis Kelamin', key: 'siswa_jenisKelamin' },
    { header: 'Tempat Lahir', key: 'siswa_tempatLahir' },
    { header: 'Tanggal Lahir (YYYY-MM-DD)', key: 'siswa_tanggalLahir' },
    { header: 'Agama', key: 'siswa_agama' },
    { header: 'Kewarganegaraan', key: 'siswa_kewarganegaraan' },
    { header: 'Nomor HP/WA', key: 'siswa_telepon' },
    { header: 'Nama Ayah', key: 'siswa_namaAyah' },
    { header: 'Nama Ibu', key: 'siswa_namaIbu' },
    { header: 'Pekerjaan Ayah', key: 'siswa_pekerjaanAyah' },
    { header: 'Pekerjaan Ibu', key: 'siswa_pekerjaanIbu' },
];

const pegawaiHeaders = [
    { header: 'Nama Lengkap (Wajib)', key: 'pegawai_nama' },
    { header: 'NIP (Wajib)', key: 'pegawai_nip' },
    { header: 'Jenis Kelamin', key: 'pegawai_jenisKelamin' },
    { header: 'Tempat Lahir', key: 'pegawai_tempatLahir' },
    { header: 'Tanggal Lahir (YYYY-MM-DD)', key: 'pegawai_tanggalLahir' },
    { header: 'Jabatan', key: 'pegawai_jabatan' },
    { header: 'Status Perkawinan', key: 'pegawai_statusPerkawinan' },
    { header: 'NUPTK', key: 'pegawai_nuptk' },
    { header: 'NRG', key: 'pegawai_nrg' },
    { header: 'Bidang Studi', key: 'pegawai_bidangStudi' },
];

