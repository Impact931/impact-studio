import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listObjects, uploadToS3, deleteObject, getPublicUrl } from '@/lib/s3';

export const runtime = 'nodejs';
// Allow up to 50MB uploads
export const maxDuration = 60;

const MEDIA_PREFIX = 'media/';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const objects = await listObjects(MEDIA_PREFIX);
    const files = objects.map((obj) => ({
      key: obj.key,
      url: getPublicUrl(obj.key),
      size: obj.size,
      lastModified: obj.lastModified,
    }));

    return NextResponse.json({ files });
  } catch (err) {
    console.error('Media list error:', err);
    return NextResponse.json({ error: 'Failed to list media' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Sanitize filename
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${MEDIA_PREFIX}${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const url = await uploadToS3(key, buffer, file.type || 'application/octet-stream');

    return NextResponse.json({ key, url });
  } catch (err) {
    console.error('Media upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (!key || !key.startsWith(MEDIA_PREFIX)) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
  }

  try {
    await deleteObject(key);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Media delete error:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
