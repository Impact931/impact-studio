import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { updateItem, getItem } from '@/lib/dynamodb';
import { updateNotionClientProfilePhoto } from '@/lib/notion-crm';

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET = process.env.S3_BUCKET_NAME!;
const CLOUDFRONT = process.env.CLOUDFRONT_DOMAIN || 'd2jen1l9e002bl.cloudfront.net';

const s3Config: ConstructorParameters<typeof S3Client>[0] = { region: REGION };
if (
  process.env.CUSTOM_AWS_ACCESS_KEY_ID &&
  process.env.CUSTOM_AWS_SECRET_ACCESS_KEY
) {
  s3Config.credentials = {
    accessKeyId: process.env.CUSTOM_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.CUSTOM_AWS_SECRET_ACCESS_KEY,
  };
}
const s3 = new S3Client(s3Config);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const customerId = formData.get('customerId') as string | null;

    if (!file || !customerId) {
      return NextResponse.json(
        { error: 'File and customerId are required' },
        { status: 400 },
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 },
      );
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File must be under 5MB' },
        { status: 400 },
      );
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const key = `customers/${customerId}/profile-photo.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    const now = new Date().toISOString();
    await updateItem(`CUSTOMER#${customerId}`, 'META', {
      profilePhotoKey: key,
      updatedAt: now,
    });

    const photoUrl = `https://${CLOUDFRONT}/${key}`;

    // Sync to Notion
    const customer = await getItem(`CUSTOMER#${customerId}`, 'META');
    if (customer?.email) {
      updateNotionClientProfilePhoto(
        customer.email as string,
        photoUrl,
      ).catch((err) => console.error('Notion photo sync error:', err));
    }

    return NextResponse.json({ url: photoUrl });
  } catch (err) {
    console.error('Photo upload error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    );
  }
}
