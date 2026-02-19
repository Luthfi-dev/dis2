
import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join, extname, basename } from 'path';
import sharp from 'sharp';

// Tentukan direktori unggahan yang aman
const UPLOADS_DIR = join(process.cwd(), '..', 'uploads');

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    let directory = data.get('directory') as string || '';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validasi direktori untuk mencegah Path Traversal
    // Hanya izinkan karakter alfanumerik dasar
    directory = directory.replace(/[^a-zA-Z0-0]/g, '');
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const targetDir = join(UPLOADS_DIR, directory);

    // Pastikan targetDir tetap berada di dalam UPLOADS_DIR
    if (!targetDir.startsWith(UPLOADS_DIR)) {
        return NextResponse.json({ success: false, error: 'Invalid directory path' }, { status: 403 });
    }

    // Buat nama file unik
    const fileExtension = extname(file.name);
    const filename = `${Date.now()}${fileExtension}`;
    const filePath = join(targetDir, filename);

    // Pastikan direktori ada
    await mkdir(targetDir, { recursive: true });

    const isImage = file.type.startsWith('image/');
    let fileBufferToSave = buffer;

    if (isImage) {
        fileBufferToSave = await sharp(buffer)
            .resize(300, 400, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .toBuffer();
    }
    
    await writeFile(filePath, fileBufferToSave);
    
    const url = `/uploads/${directory ? `${directory}/` : ''}${filename}`;
    return NextResponse.json({ success: true, url: url });
  } catch (error: any) {
    console.error('Error writing file:', error);
    return NextResponse.json({ success: false, error: `Failed to save file: ${error.message}` }, { status: 500 });
  }
}
