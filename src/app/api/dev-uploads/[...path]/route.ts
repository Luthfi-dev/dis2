
// src/app/api/dev-uploads/[...path]/route.ts
import {NextRequest, NextResponse} from 'next/server';
import path from 'path';
import fs from 'fs';
import mime from 'mime';

// This route is for DEVELOPMENT ONLY to proxy requests from the Next.js dev server
// to the file system, mimicking the production rewrite behavior.

const UPLOADS_DIR = path.join(process.cwd(), '..', 'uploads');

export async function GET(
  req: NextRequest,
  {params}: {params: Promise<{path: string[]}>}
) {
  // Prevent this route from being accessed in production
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not found', {status: 404});
  }

  // Next.js 15: params must be awaited
  const { path: pathSegments } = await params;
  const filePath = path.join(UPLOADS_DIR, ...pathSegments);

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
