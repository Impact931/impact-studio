import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getItem, putItem } from '@/lib/dynamodb';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) {
    return NextResponse.json({ error: 'slug required' }, { status: 400 });
  }

  const item = await getItem(`PAGE#${slug}`, 'CONTENT');
  if (!item) {
    return NextResponse.json({ sections: [], seo: {} });
  }

  return NextResponse.json({
    sections: item.sections || [],
    seo: item.seo || {},
    updatedAt: item.updatedAt,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { slug, content } = body;

  if (!slug || !content) {
    return NextResponse.json({ error: 'slug and content required' }, { status: 400 });
  }

  await putItem({
    PK: `PAGE#${slug}`,
    SK: 'CONTENT',
    sections: content.sections,
    seo: content.seo || {},
    updatedAt: new Date().toISOString(),
    updatedBy: session.user?.email || 'admin',
    status: 'draft',
  });

  return NextResponse.json({ success: true });
}
