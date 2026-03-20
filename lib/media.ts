/**
 * Media Library Service Layer
 * DynamoDB CRUD operations for media management
 */

import { randomUUID } from 'crypto';
import { putItem, getItem, scanItems, updateItem, deleteItem } from './dynamodb';
import { deleteObject } from './s3';

export interface MediaRecord {
  PK: string;
  SK: string;
  mediaId: string;
  filename: string;
  mimeType: string;
  mediaType: 'image' | 'video' | 'document';
  status: 'uploading' | 'ready' | 'error';
  s3Key: string;
  publicUrl: string;
  fileSize: number;
  contentHash?: string;
  tags?: string[];
  title?: string;
  altText?: string;
  caption?: string;
  createdAt: string;
  updatedAt: string;
}

export function generateMediaId(): string {
  return randomUUID();
}

export async function createMediaRecord(
  data: Omit<MediaRecord, 'PK' | 'SK'>,
): Promise<MediaRecord> {
  const record: MediaRecord = {
    ...data,
    PK: `MEDIA#${data.mediaId}`,
    SK: 'META',
  };
  await putItem(record as unknown as Record<string, unknown>);
  return record;
}

export async function getMediaRecord(
  mediaId: string,
): Promise<MediaRecord | null> {
  const item = await getItem(`MEDIA#${mediaId}`, 'META');
  return (item as MediaRecord) ?? null;
}

export async function updateMediaRecord(
  mediaId: string,
  updates: Partial<MediaRecord>,
): Promise<void> {
  const safeUpdates = { ...updates, updatedAt: new Date().toISOString() };
  delete (safeUpdates as Record<string, unknown>).PK;
  delete (safeUpdates as Record<string, unknown>).SK;
  await updateItem(`MEDIA#${mediaId}`, 'META', safeUpdates);
}

export async function deleteMediaRecord(mediaId: string): Promise<boolean> {
  const record = await getMediaRecord(mediaId);
  if (!record) return false;

  // Delete from S3
  try {
    await deleteObject(record.s3Key);
  } catch (err) {
    console.warn('Failed to delete S3 object:', err);
  }

  // Delete DynamoDB record
  await deleteItem(`MEDIA#${mediaId}`, 'META');

  return true;
}

export async function listMediaRecords(): Promise<MediaRecord[]> {
  const items = await scanItems(
    'begins_with(PK, :pk) AND SK = :sk',
    { ':pk': 'MEDIA#', ':sk': 'META' },
  );

  return (items as unknown as MediaRecord[])
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function findByContentHash(
  hash: string,
): Promise<MediaRecord | null> {
  // Scan for matching hash — acceptable for small media libraries
  const items = await scanItems(
    'begins_with(PK, :pk) AND SK = :sk AND contentHash = :hash',
    { ':pk': 'MEDIA#', ':sk': 'META', ':hash': hash },
  );
  const record = items[0] as unknown as MediaRecord | undefined;
  return record ?? null;
}
