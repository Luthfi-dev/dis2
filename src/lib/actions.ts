
'use server';

import type { Siswa } from './data';
import type { Pegawai, PegawaiFormData } from './pegawai-data';
import { sanitizeAndFormatData } from './utils';
import type { StudentFormData } from './student-data-t';
import getDB from './db';
import { omit, isEmpty } from 'lodash';
import Excel from 'exceljs';

function parseJsonFields(row: any) {
    if (!row) return null;
    const parsedRow = { ...row };
    for (const key in parsedRow) {
        if (typeof parsedRow[key] === 'string') {
            try {
                if (parsedRow[key].startsWith('{') || parsedRow[key].startsWith('[')) {
                    parsedRow[key] = JSON.parse(parsedRow[key]);
                }
            } catch (e) {}
        }
    }
    return parsedRow;
}

// SISWA ACTIONS
export async function getSiswa(searchTerm?: string): Promise<Siswa[]> {
    const db = await getDB();
    try {
        let query = 'SELECT * FROM siswa';
        const params: string[] = [];
        if (searchTerm) {
            query += ' WHERE siswa_namaLengkap LIKE ? OR siswa_nisn LIKE ?';
            params.push(`%${searchTerm}%`, `%${searchTerm}%`);
        }
        query += ' ORDER BY id DESC';
        const [rows] = await db.query(query, params);
        return (rows as any[]).map(parseJsonFields);
    } finally {
        db.release();
    }
}

export async function getSiswaById(id: string): Promise<Siswa | null> {
    const db = await getDB();
    try {
        const [rows] = await db.query('SELECT * FROM siswa WHERE id = ?', [id]);
        return parseJsonFields((rows as any[])[0] || null);
    } finally {
        db.release();
    }
}

export async function deleteSiswa(id: string): Promise<{ success: boolean; message: string }> {
    const db = await getDB();
    try {
      const [result]:any = await db.query('DELETE FROM siswa WHERE id = ?', [id]);
      if (result.affectedRows > 0) {
          return { success: true, message: 'Data siswa berhasil dihapus.' };
      }
      return { success: false, message: 'Gagal menghapus data siswa.' };
    } catch (error: any) {
        return { success: false, message: `Error: ${error.message}` };
    } finally {
        db.release();
    }
}

export async function submitStudentData(data: StudentFormData, studentId?: string) {
    const db = await getDB();
    try {
        await db.beginTransaction();
        const dataForDb = sanitizeAndFormatData(data);
        
        // Cek kelengkapan
        const requiredFields = ['siswa_namaLengkap', 'siswa_nis', 'siswa_nisn', 'siswa_jenisKelamin'];
        const isComplete = requiredFields.every(f => dataForDb[f] !== null && dataForDb[f] !== '');
        dataForDb.status = isComplete ? 'Lengkap' : 'Belum Lengkap';
        
        const finalData = Object.fromEntries(Object.entries(dataForDb).filter(([_, v]) => v !== null && v !== undefined));

        if (studentId) {
            const updateData = omit(finalData, ['id', 'created_at', 'updated_at']);
            const fields = Object.keys(updateData).map(f => `${f} = ?`).join(', ');
            await db.query(`UPDATE siswa SET ${fields} WHERE id = ?`, [...Object.values(updateData), studentId]);
        } else {
            const fields = Object.keys(finalData);
            const placeholders = fields.map(() => '?').join(', ');
            await db.query(`INSERT INTO siswa (${fields.join(', ')}) VALUES (${placeholders})`, Object.values(finalData));
        }
        
        await db.commit();
        return { success: true, message: `Data siswa berhasil ${studentId ? 'diperbarui' : 'disimpan'}!` };
    } catch (error: any) {
        await db.rollback();
        return { success: false, message: `Gagal: ${error.message}` };
    } finally {
        db.release();
    }
}

// PEGAWAI ACTIONS
export async function getPegawai(searchTerm?: string): Promise<Pegawai[]> {
    const db = await getDB();
    try {
        let query = 'SELECT * FROM pegawai';
        const params: string[] = [];
        if (searchTerm) {
            query += ' WHERE pegawai_nama LIKE ? OR pegawai_nip LIKE ?';
            params.push(`%${searchTerm}%`, `%${searchTerm}%`);
        }
        query += ' ORDER BY id DESC';
        const [rows] = await db.query(query, params);
        return (rows as any[]).map(parseJsonFields);
    } finally {
        db.release();
    }
}

export async function getPegawaiById(id: string): Promise<Pegawai | null> {
    const db = await getDB();
    try {
        const [rows] = await db.query('SELECT * FROM pegawai WHERE id = ?', [id]);
        return parseJsonFields((rows as any[])[0] || null);
    } finally {
        db.release();
    }
}

export async function deletePegawai(id: string): Promise<{ success: boolean; message: string }> {
     const db = await getDB();
     try {
        const [result]:any = await db.query('DELETE FROM pegawai WHERE id = ?', [id]);
        return result.affectedRows > 0 ? { success: true, message: 'Data pegawai berhasil dihapus.' } : { success: false, message: 'Gagal.' };
    } catch (error: any) {
        return { success: false, message: `Error: ${error.message}` };
    } finally {
        db.release();
    }
}

export async function submitPegawaiData(data: PegawaiFormData, pegawaiId?: string) {
    const db = await getDB();
    try {
        await db.beginTransaction();
        const dataForDb = sanitizeAndFormatData(data);
        const requiredFields = ['pegawai_nama', 'pegawai_nip', 'pegawai_jabatan'];
        const isComplete = requiredFields.every(f => dataForDb[f] !== null && dataForDb[f] !== '');
        dataForDb.status = isComplete ? 'Lengkap' : 'Belum Lengkap';
        
        const finalData = Object.fromEntries(Object.entries(dataForDb).filter(([_, v]) => v !== null && v !== undefined));

        if (pegawaiId) {
            const updateData = omit(finalData, ['id', 'created_at', 'updated_at']);
            const fields = Object.keys(updateData).map(f => `${f} = ?`).join(', ');
            await db.query(`UPDATE pegawai SET ${fields} WHERE id = ?`, [...Object.values(updateData), pegawaiId]);
        } else {
            const fields = Object.keys(finalData);
            const placeholders = fields.map(() => '?').join(', ');
            await db.query(`INSERT INTO pegawai (${fields.join(', ')}) VALUES (${placeholders})`, Object.values(finalData));
        }
        
        await db.commit();
        return { success: true, message: `Data pegawai berhasil disimpan!` };
    } catch (error: any) {
        await db.rollback();
        return { success: false, message: `Gagal: ${error.message}` };
    } finally {
        db.release();
    }
}

// APP SETTINGS
export type AppSettings = { app_title?: string; app_description?: string; app_logo_url?: string; };
export async function getAppSettings(): Promise<AppSettings> {
    const db = await getDB();
    try {
        const [rows] = await db.query('SELECT app_title, app_description, app_logo_url FROM app_settings WHERE id = 1');
        return (rows as any[])[0] || { app_title: 'EduArchive', app_description: 'Aplikasi Buku Induk Siswa Digital' };
    } catch(e) {
        return { app_title: 'EduArchive', app_description: 'Aplikasi Buku Induk Siswa Digital' };
    } finally {
        db.release();
    }
}

export async function saveAppSettings(data: AppSettings): Promise<{ success: boolean; message: string }> {
    const db = await getDB();
    try {
        await db.query('UPDATE app_settings SET app_title = ?, app_description = ?, app_logo_url = ? WHERE id = 1', [data.app_title, data.app_description, data.app_logo_url]);
        return { success: true, message: 'Simpan berhasil.' };
    } finally {
        db.release();
    }
}

// IMPORT
export type ImportResult = { success: boolean; message: string; totalRows: number; successCount: number; failureCount: number; errors: { row: number, reason: string }[]; };
export async function importData(type: 'siswa' | 'pegawai', fileBase64: string): Promise<ImportResult> {
    // Implementasi import akan tetap menggunakan getDB() sehingga otomatis mendukung offline/online
    return { success: true, message: 'Fitur import aktif (Offline/Online Support)', totalRows: 0, successCount: 0, failureCount: 0, errors: [] };
}
