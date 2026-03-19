import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { putItem } from '@/lib/dynamodb';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { slug, content } = body;

  if (!slug || !content) {
    return NextResponse.json({ error: 'slug and content required' }, { status: 400 });
  }

  const now = new Date().toISOString();

  await putItem({
    PK: `PAGE#${slug}`,
    SK: 'CONTENT',
    sections: content.sections,
    seo: content.seo || {},
    updatedAt: now,
    publishedAt: now,
    updatedBy: session.user?.email || 'admin',
    status: 'published',
  });

  return NextResponse.json({ success: true, publishedAt: now });
}
