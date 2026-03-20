import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listMediaRecords, deleteMediaRecord, getMediaRecord } from '@/lib/media';

export const runtime = 'nodejs';

/**
 * GET /api/admin/media — List all media from DynamoDB
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const records = await listMediaRecords();
    const files = records.map((r) => ({
      key: r.s3Key,
      url: r.publicUrl,
      size: r.fileSize,
      lastModified: r.updatedAt || r.createdAt,
      mediaId: r.mediaId,
      filename: r.filename,
      mediaType: r.mediaType,
      status: r.status,
    }));

    return NextResponse.json({ files });
  } catch (err) {
    console.error('Media list error:', err);
    return NextResponse.json({ error: 'Failed to list media' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/media — Delete media by mediaId or key
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mediaId = searchParams.get('mediaId');
  const key = searchParams.get('key');

  if (!mediaId && !key) {
    return NextResponse.json({ error: 'mediaId or key required' }, { status: 400 });
  }

  try {
    if (mediaId) {
      await deleteMediaRecord(mediaId);
    } else if (key) {
      // Find by key — search through records
      const records = await listMediaRecords();
      const match = records.find((r) => r.s3Key === key);
      if (match) {
        await deleteMediaRecord(match.mediaId);
      }
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Media delete error:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
