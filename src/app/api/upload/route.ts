
import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join, extname } from 'path';
import sharp from 'sharp';

// Direktori penyimpanan file yang aman
const UPLOADS_DIR = join(process.cwd(), '..', 'uploads');

// Daftar direktori yang diizinkan untuk mencegah serangan Path Traversal
const ALLOWED_DIRECTORIES = ['siswa', 'pegawai', 'users', 'app'];

// Daftar ekstensi file yang diizinkan (Whitelisting)
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'];

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    let directory = data.get('directory') as string || '';

    if (!file) {
      return NextResponse.json({ success: false, error: 'File tidak ditemukan.' }, { status: 400 });
    }

    // 1. Validasi Nama Direktori
    // Hanya izinkan direktori yang ada dalam daftar whitelist
    if (!ALLOWED_DIRECTORIES.includes(directory)) {
        return NextResponse.json({ success: false, error: 'Akses direktori ditolak.' }, { status: 403 });
    }
    
    // 2. Validasi Ekstensi File
    const fileExtension = extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
        return NextResponse.json({ success: false, error: `Tipe file ${fileExtension} tidak diizinkan.` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const targetDir = join(UPLOADS_DIR, directory);

    // Pastikan targetDir tetap berada di dalam UPLOADS_DIR (Double Check)
    if (!targetDir.startsWith(UPLOADS_DIR)) {
        return NextResponse.json({ success: false, error: 'Lokasi penyimpanan tidak valid.' }, { status: 403 });
    }

    // 3. Buat Nama File Unik (Menggunakan Timestamp untuk menghindari konflik dan menyembunyikan nama asli)
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}${fileExtension}`;
    const filePath = join(targetDir, filename);

    // Pastikan direktori tujuan ada
    await mkdir(targetDir, { recursive: true });

    const isImage = file.type.startsWith('image/') && fileExtension !== '.pdf';
    let fileBufferToSave = buffer;

    // 4. Pengoptimalan Gambar (Sharp juga berfungsi sebagai sanitasi karena memproses ulang buffer gambar)
    if (isImage) {
        try {
            fileBufferToSave = await sharp(buffer)
                .resize(800, 1000, { // Ukuran sedikit lebih besar untuk kualitas dokumen
                    fit: 'inside',
                    withoutEnlargement: true,
                })
                .toBuffer();
        } catch (sharpError) {
            console.error('Sharp processing error:', sharpError);
            // Jika gagal diproses sebagai gambar, tolak karena mungkin file rusak atau manipulasi
            return NextResponse.json({ success: false, error: 'File gambar tidak valid atau rusak.' }, { status: 400 });
        }
    }
    
    // Simpan file ke sistem
    await writeFile(filePath, fileBufferToSave);
    
    const url = `/uploads/${directory}/${filename}`;
    return NextResponse.json({ success: true, url: url });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, error: 'Gagal menyimpan file ke server.' }, { status: 500 });
  }
}
