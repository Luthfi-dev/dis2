import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join, extname } from 'path';
import sharp from 'sharp';

// Folder uploads diletakkan di luar proyek agar mudah dikelola dev
const UPLOADS_DIR = join(process.cwd(), '..', 'uploads');

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;
  const directory = data.get('directory') as string || '';

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const targetDir = join(UPLOADS_DIR, directory);

  const fileExtension = extname(file.name);
  const filename = `${Date.now()}${fileExtension}`;
  const path = join(targetDir, filename);

  try {
    // Pastikan folder tersedia
    await mkdir(targetDir, { recursive: true });

    const isImage = file.type.startsWith('image/');
    let fileBufferToSave = buffer;

    if (isImage) {
        // MATIKAN CACHE DISK SHARP UNTUK MENCEGAH PENULISAN FILE SAMPAH DI ROOT/HOME
        sharp.cache(false); 
        
        fileBufferToSave = await sharp(buffer)
            .resize(300, 400, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .toBuffer();
    }
    
    await writeFile(path, fileBufferToSave);
    
    const url = `/uploads/${directory ? `${directory}/` : ''}${filename}`;
    return NextResponse.json({ success: true, url: url });
  } catch (error: any) {
    console.error('Error writing file:', error);
    return NextResponse.json({ success: false, error: `Failed to save file: ${error.message}` }, { status: 500 });
  }
}
