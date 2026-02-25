import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join, extname } from 'path';
import sharp from 'sharp';

// Folder uploads berada di luar direktori proyek (../uploads)
const UPLOADS_DIR = join(process.cwd(), '..', 'uploads');

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file = data.get('file') as File | null;
    const directory = (data.get('directory') as string) || '';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const targetDir = join(UPLOADS_DIR, directory);

    const fileExtension = extname(file.name);
    const filename = `${Date.now()}${fileExtension}`;
    const path = join(targetDir, filename);

    // Pastikan folder tersedia
    await mkdir(targetDir, { recursive: true });

    if (file.type.startsWith('image/')) {
        // MATIKAN CACHE DISK SHARP UNTUK MENCEGAH PENULISAN FILE SAMPAH DI ROOT/HOME
        // Sharp akan memproses sepenuhnya di memori
        sharp.cache(false); 
        
        await sharp(buffer)
            .resize(800, 800, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .toFile(path);
    } else {
        // Tulis file non-gambar langsung ke folder target eksternal
        await writeFile(path, buffer);
    }
    
    const url = `/uploads/${directory ? `${directory}/` : ''}${filename}`;
    return NextResponse.json({ success: true, url: url });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, error: `Upload failed: ${error.message}` }, { status: 500 });
  }
}
