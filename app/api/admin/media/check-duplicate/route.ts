import { NextRequest, NextResponse } from 'next/server';
import { findByContentHash } from '@/lib/media';

/**
 * POST /api/admin/media/check-duplicate — Check if file already exists by hash
 */
export async function POST(req: NextRequest) {
  try {
    const { contentHash } = await req.json();
    if (!contentHash) {
      return NextResponse.json({ isDuplicate: false });
    }

    const existing = await findByContentHash(contentHash);
    if (existing) {
      return NextResponse.json({
        isDuplicate: true,
        existingMedia: {
          mediaId: existing.mediaId,
          filename: existing.filename,
          publicUrl: existing.publicUrl,
        },
      });
    }

    return NextResponse.json({ isDuplicate: false });
  } catch {
    // Gracefully fail — don't block uploads if hash check fails
    return NextResponse.json({ isDuplicate: false });
  }
}
