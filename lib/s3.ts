import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const BUCKET = process.env.S3_BUCKET_NAME!;
const REGION = process.env.AWS_REGION || 'us-east-1';
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN; // e.g. d1234abcdef.cloudfront.net

const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
  region: REGION,
};

if (
  process.env.CUSTOM_AWS_ACCESS_KEY_ID &&
  process.env.CUSTOM_AWS_SECRET_ACCESS_KEY
) {
  clientConfig.credentials = {
    accessKeyId: process.env.CUSTOM_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.CUSTOM_AWS_SECRET_ACCESS_KEY,
  };
}

const s3 = new S3Client(clientConfig);

/**
 * Generate a presigned PUT URL for direct client-side uploads.
 * Expires in 5 minutes (300 seconds).
 */
export async function getUploadUrl(
  key: string,
  contentType: string,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3, command, { expiresIn: 300 });
}

/**
 * Return the public URL for an object.
 * Uses CloudFront domain when available, otherwise falls back to S3.
 */
export function getPublicUrl(key: string): string {
  if (CLOUDFRONT_DOMAIN) {
    return `https://${CLOUDFRONT_DOMAIN}/${key}`;
  }
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}
