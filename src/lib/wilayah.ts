
'use server'
import pool from './db';

export type Wilayah = {
    id: string;
    name: string;
}

export type Provinsi = Wilayah;
export type Kabupaten = Wilayah & { province_id: string };
export type Kecamatan = Wilayah & { district_id: string };
export type Desa = Wilayah & { district_id: string };


// --- Getter functions from DB ---
export async function getProvinces(): Promise<Provinsi[]> {
    let db;
    try {
        db = await pool.getConnection();
        const [rows] = await db.query('SELECT id, name FROM provinsi ORDER BY name');
        return rows as Provinsi[];
    } catch (error: any) {
        console.error('Database Error in getProvinces:', error);
        throw new Error(`Gagal mengambil data provinsi: ${error.message}`);
    } finally {
        if (db) db.release();
    }
};

export async function getKabupatens(provinceId?: string): Promise<Kabupaten[]> {
    if (!provinceId) return [];
    let db;
    try {
        db = await pool.getConnection();
        const [rows] = await db.query('SELECT id, name, province_id FROM kabupaten WHERE province_id = ? ORDER BY name', [provinceId]);
        return rows as Kabupaten[];
    } catch (error: any) {
        console.error('Database Error in getKabupatens:', error);
        throw new Error(`Gagal mengambil data kabupaten: ${error.message}`);
    } finally {
        if (db) db.release();
    }
};

export async function getKecamatans(regencyId?: string): Promise<Kecamatan[]> {
    if (!regencyId) return [];
    let db;
    try {
        db = await pool.getConnection();
        const [rows] = await db.query('SELECT id, name, regency_id FROM kecamatan WHERE regency_id = ? ORDER BY name', [regencyId]);
        return rows as Kecamatan[];
    } catch (error: any) {
        console.error('Database Error in getKecamatans:', error);
        throw new Error(`Gagal mengambil data kecamatan: ${error.message}`);
    } finally {
        if (db) db.release();
    }
};

export async function getDesas(districtId?: string): Promise<Desa[]> {
    if (!districtId) return [];
    let db;
    try {
        db = await pool.getConnection();
        const [rows] = await db.query('SELECT id, name, district_id FROM desa WHERE district_id = ? ORDER BY name', [districtId]);
        return rows as Desa[];
    } catch (error: any) {
        console.error('Database Error in getDesas:', error);
        throw new Error(`Gagal mengambil data desa: ${error.message}`);
    } finally {
        if (db) db.release();
    }
};


// --- Helper functions to get names by ID ---
export async function getProvinceName(id?: string): Promise<string> {
    if (!id) return '';
    let db;
    try {
        db = await pool.getConnection();
        const [rows]: any[] = await db.query('SELECT name FROM provinsi WHERE id = ?', [id]);
        return rows[0]?.name || id;
    } catch (error: any) {
        console.error(`Error fetching province name for id ${id}:`, error);
        return id; // Return ID as fallback on error
    }
    finally {
        if (db) db.release();
    }
}

export async function getKabupatenName(id?: string): Promise<string> {
    if (!id) return '';
    let db;
    try {
        db = await pool.getConnection();
        const [rows]: any[] = await db.query('SELECT name FROM kabupaten WHERE id = ?', [id]);
        return rows[0]?.name || id;
    } catch (error: any) {
        console.error(`Error fetching kabupaten name for id ${id}:`, error);
        return id;
    }
    finally {
        if (db) db.release();
    }
}

export async function getKecamatanName(id?: string): Promise<string> {
    if (!id) return '';
    let db;
    try {
        db = await pool.getConnection();
        const [rows]: any[] = await db.query('SELECT name FROM kecamatan WHERE id = ?', [id]);
        return rows[0]?.name || id;
    } catch (error: any) {
        console.error(`Error fetching kecamatan name for id ${id}:`, error);
        return id;
    }
    finally {
        if (db) db.release();
    }
}

export async function getDesaName(id?: string): Promise<string> {
    if (!id) return '';
    let db;
    try {
        db = await pool.getConnection();
        const [rows]: any[] = await db.query('SELECT name FROM desa WHERE id = ?', [id]);
        return rows[0]?.name || id;
    } catch (error: any) {
        console.error(`Error fetching desa name for id ${id}:`, error);
        return id;
    }
    finally {
        if (db) db.release();
    }
}

    