import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProduct, updateProduct, deleteProduct } from '@/lib/catalog';

export const runtime = 'nodejs';

/**
 * GET /api/admin/catalog/[id] — Get single product
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const product = await getProduct(params.id);
    if (!product) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (err) {
    console.error('Catalog get error:', err);
    return NextResponse.json({ error: 'Failed to get product' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/catalog/[id] — Update product
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const product = await getProduct(params.id);
    if (!product) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await updateProduct(params.id, product.category, body);
    const updated = await getProduct(params.id);
    return NextResponse.json({ product: updated });
  } catch (err) {
    console.error('Catalog update error:', err);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/catalog/[id] — Delete product
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const product = await getProduct(params.id);
    if (!product) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await deleteProduct(params.id, product.category);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Catalog delete error:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
