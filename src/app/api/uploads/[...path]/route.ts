import {NextRequest, NextResponse} from 'next/server';
import path from 'path';
import fs from 'fs';
import mime from 'mime';

const UPLOADS_DIR = path.join(process.cwd(), '..', 'uploads');

/**
 * Menggunakan ReadableStream untuk mengirim file (Streaming).
 * Ini jauh lebih hemat memori dibanding readFileSync/readFile.
 */
function nodeStreamToWeb(nodeStream: fs.ReadStream) {
  return new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk) => controller.enqueue(chunk));
      nodeStream.on('end', () => controller.close());
      nodeStream.on('error', (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });
}

export async function GET(
  req: NextRequest,
  {params}: {params: Promise<{path: string[]}>}
) {
  const { path: pathSegments } = await params;
  const safePath = pathSegments.filter(segment => !segment.includes('..'));
  const filePath = path.join(UPLOADS_DIR, ...safePath);

  try {
    const stats = await fs.promises.stat(filePath);
    if (!stats.isFile()) return new NextResponse('Not found', {status: 404});

    const mimeType = mime.getType(filePath) || 'application/octet-stream';
    const fileStream = fs.createReadStream(filePath);

    return new NextResponse(nodeStreamToWeb(fileStream), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (e) {
    return new NextResponse('File not found', {status: 404});
  }
}
