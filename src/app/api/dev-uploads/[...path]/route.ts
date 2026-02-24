import {NextRequest, NextResponse} from 'next/server';
import path from 'path';
import fs from 'fs';
import mime from 'mime';

// Menggunakan folder uploads di luar direktori proyek (../uploads)
const UPLOADS_DIR = path.join(process.cwd(), '..', 'uploads');

export async function GET(
  req: NextRequest,
  {params}: {params: Promise<{path: string[]}>}
) {
  // Prevent this route from being accessed in production
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not found', {status: 404});
  }

  const { path: pathSegments } = await params;
  
  // Sanitasi path
  const safePath = pathSegments.filter(segment => !segment.includes('..'));
  const filePath = path.join(UPLOADS_DIR, ...safePath);

  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
  } catch (e) {
    return new NextResponse('Not found', {status: 404});
  }

  const fileContents = await fs.promises.readFile(filePath);
  const mimeType = mime.getType(filePath) || 'application/octet-stream';

  return new NextResponse(fileContents, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Content-Length': fileContents.length.toString(),
    },
  });
}
