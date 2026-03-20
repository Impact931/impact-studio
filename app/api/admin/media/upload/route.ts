import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUploadUrl, getPublicUrl } from '@/lib/s3';
import { generateMediaId, createMediaRecord } from '@/lib/media';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff', 'image/avif',
];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_DOC_TYPES = ['application/pdf'];

/**
 * POST /api/admin/media/upload — Generate presigned URL and create DynamoDB record
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { filename, contentType, fileSize, contentHash } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'filename and contentType are required' },
        { status: 400 },
      );
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(contentType);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(contentType);
    const isDoc = ALLOWED_DOC_TYPES.includes(contentType);

    if (!isImage && !isVideo && !isDoc) {
      return NextResponse.json(
        { error: `Unsupported file type: ${contentType}` },
        { status: 400 },
      );
    }

    const mediaType = isImage ? 'image' : isVideo ? 'video' : 'document';
    const mediaId = generateMediaId();
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const folder = mediaType === 'image'
      ? 'media/images'
      : mediaType === 'video'
      ? 'media/videos'
      : 'media/documents';
    const s3Key = `${folder}/${mediaId}/${safeName}`;

    // Generate presigned URL for direct client upload
    const uploadUrl = await getUploadUrl(s3Key, contentType);
    const publicUrl = getPublicUrl(s3Key);

    // Create DynamoDB record (best-effort)
    const now = new Date().toISOString();
    try {
      await createMediaRecord({
        mediaId,
        filename,
        mimeType: contentType,
        mediaType: mediaType as 'image' | 'video' | 'document',
        status: 'uploading',
        s3Key,
        publicUrl,
        fileSize: fileSize || 0,
        contentHash,
        tags: [],
        createdAt: now,
        updatedAt: now,
      });
    } catch (dbErr) {
      console.warn('Failed to create media DynamoDB record:', dbErr);
    }

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      s3Key,
      mediaId,
    });
  } catch (err) {
    console.error('Media upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
