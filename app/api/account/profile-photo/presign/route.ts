import { NextRequest, NextResponse } from 'next/server';
import { getUploadUrl, getPublicUrl } from '@/lib/s3';
import { updateItem, getItem } from '@/lib/dynamodb';
import { updateNotionClientProfilePhoto } from '@/lib/notion-crm';

export const runtime = 'nodejs';

/**
 * POST /api/account/profile-photo/presign
 * Returns a presigned S3 URL for direct client-side upload.
 * Body: { customerId, contentType, filename }
 */
export async function POST(req: NextRequest) {
  try {
    const { customerId, contentType, filename } = await req.json();

    if (!customerId || !contentType) {
      return NextResponse.json(
        { error: 'customerId and contentType are required' },
        { status: 400 },
      );
    }

    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 },
      );
    }

    const ext = contentType === 'image/webp' ? 'webp' : (filename?.split('.').pop() || 'jpg');
    const key = `customers/${customerId}/profile-photo.${ext}`;

    const uploadUrl = await getUploadUrl(key, contentType);
    const publicUrl = getPublicUrl(key);

    return NextResponse.json({ uploadUrl, publicUrl, key });
  } catch (err) {
    console.error('Profile photo presign error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Presign failed' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/account/profile-photo/presign
 * Called after upload completes to update DynamoDB + Notion.
 * Body: { customerId, key }
 */
export async function PUT(req: NextRequest) {
  try {
    const { customerId, key } = await req.json();

    if (!customerId || !key) {
      return NextResponse.json(
        { error: 'customerId and key required' },
        { status: 400 },
      );
    }

    const publicUrl = getPublicUrl(key);
    const now = new Date().toISOString();

    await updateItem(`CUSTOMER#${customerId}`, 'META', {
      profilePhotoKey: key,
      updatedAt: now,
    });

    // Sync to Notion
    const customer = await getItem(`CUSTOMER#${customerId}`, 'META');
    if (customer?.email) {
      updateNotionClientProfilePhoto(
        customer.email as string,
        publicUrl,
      ).catch((err) => console.error('Notion photo sync error:', err));
    }

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('Profile photo complete error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Update failed' },
      { status: 500 },
    );
  }
}
