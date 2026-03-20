import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMediaRecord, updateMediaRecord } from '@/lib/media';

/**
 * POST /api/admin/media/upload/complete — Mark upload as ready
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { mediaId, fileSize } = await req.json();

    if (!mediaId) {
      return NextResponse.json({ error: 'mediaId is required' }, { status: 400 });
    }

    const item = await getMediaRecord(mediaId);
    if (!item) {
      return NextResponse.json({ error: 'Media item not found' }, { status: 404 });
    }

    await updateMediaRecord(mediaId, {
      status: 'ready',
      ...(fileSize ? { fileSize } : {}),
    });

    return NextResponse.json({ success: true, mediaId });
  } catch (err) {
    console.error('Upload complete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
