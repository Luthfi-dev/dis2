'use server'
import getDB from './db';

export type Wilayah = {
    id: string;
    name: string;
}

export type Provinsi = Wilayah;
export type Kabupaten = Wilayah & { province_id: string };
export type Kecamatan = Wilayah & { regency_id: string };
export type Desa = Wilayah & { district_id: string };


// --- Getter functions from DB ---
export async function getProvinces(): Promise<Provinsi[]> {
    const db = await getDB();
    try {
        const [rows] = await db.query('SELECT id, name FROM provinsi ORDER BY name');
        return rows as Provinsi[];
    } finally {
        db.release();
    }
};

export async function getKabupatens(provinceId?: string): Promise<Kabupaten[]> {
    if (!provinceId) return [];
    const db = await getDB();
    try {
        const [rows] = await db.query('SELECT id, name, province_id FROM kabupaten WHERE province_id = ? ORDER BY name', [provinceId]);
        return rows as Kabupaten[];
    } finally {
        db.release();
    }
};

export async function getKecamatans(regencyId?: string): Promise<Kecamatan[]> {
    if (!regencyId) return [];
    const db = await getDB();
    try {
        const [rows] = await db.query('SELECT id, name, regency_id FROM kecamatan WHERE regency_id = ? ORDER BY name', [regencyId]);
        return rows as Kecamatan[];
    } finally {
        db.release();
    }
};

export async function getDesas(districtId?: string): Promise<Desa[]> {
    if (!districtId) return [];
    const db = await getDB();
    try {
        const [rows] = await db.query('SELECT id, name, district_id FROM desa WHERE district_id = ? ORDER BY name', [districtId]);
        return rows as Desa[];
    } finally {
        db.release();
    }
};


// --- Helper functions to get names by ID ---
export async function getProvinceName(id?: string): Promise<string> {
    if (!id) return '';
    const db = await getDB();
    try {
        const [rows]: any[] = await db.query('SELECT name FROM provinsi WHERE id = ?', [id]);
        return rows[0]?.name || id;
    } finally {
        db.release();
    }
}

export async function getKabupatenName(id?: string): Promise<string> {
    if (!id) return '';
    const db = await getDB();
    try {
        const [rows]: any[] = await db.query('SELECT name FROM kabupaten WHERE id = ?', [id]);
        return rows[0]?.name || id;
    } finally {
        db.release();
    }
}

export async function getKecamatanName(id?: string): Promise<string> {
    if (!id) return '';
    const db = await getDB();
    try {
        const [rows]: any[] = await db.query('SELECT name FROM kecamatan WHERE id = ?', [id]);
        return rows[0]?.name || id;
    } finally {
        db.release();
    }
}

export async function getDesaName(id?: string): Promise<string> {
    if (!id) return '';
    const db = await getDB();
    try {
        const [rows]: any[] = await db.query('SELECT name FROM desa WHERE id = ?', [id]);
        return rows[0]?.name || id;
    } finally {
        db.release();
    }
}
