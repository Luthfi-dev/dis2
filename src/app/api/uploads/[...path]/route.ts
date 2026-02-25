import {NextRequest, NextResponse} from 'next/server';
import path from 'path';
import fs from 'fs';
import mime from 'mime';

// Folder uploads berada di luar direktori proyek (../uploads)
const UPLOADS_DIR = path.join(process.cwd(), '..', 'uploads');

export async function GET(
  req: NextRequest,
  {params}: {params: Promise<{path: string[]}>}
) {
  // Next.js 15: params must be awaited to comply with type validity
  const { path: pathSegments } = await params;
  
  // Sanitasi path untuk mencegah directory traversal
  const safePath = pathSegments.filter(segment => !segment.includes('..'));
  const filePath = path.join(UPLOADS_DIR, ...safePath);

  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
  } catch (e) {
    return new NextResponse('File not found', {status: 404});
  }

  const fileContents = await fs.promises.readFile(filePath);
  const mimeType = mime.getType(filePath) || 'application/octet-stream';

  return new NextResponse(fileContents, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Content-Length': fileContents.length.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
