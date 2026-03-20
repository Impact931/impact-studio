import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  listProducts,
  createProduct,
  generateProductId,
  seedCatalogIfEmpty,
} from '@/lib/catalog';

export const runtime = 'nodejs';

/**
 * GET /api/admin/catalog — List all products (seeds from static data on first call)
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Auto-seed on first access if catalog is empty
    const seeded = await seedCatalogIfEmpty();

    const products = await listProducts();
    return NextResponse.json({ products, seeded });
  } catch (err) {
    console.error('Catalog list error:', err);
    return NextResponse.json({ error: 'Failed to list products' }, { status: 500 });
  }
}

/**
 * POST /api/admin/catalog — Create a new product
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const now = new Date().toISOString();
    const productId = generateProductId();

    const product = await createProduct({
      productId,
      name: body.name || 'New Product',
      description: body.description || '',
      category: body.category || 'alacarte',
      priceInStudio: body.priceInStudio || 0,
      priceOutOfStudio: body.priceOutOfStudio || 0,
      image: body.image || undefined,
      active: body.active !== false,
      included: body.included || false,
      sortOrder: body.sortOrder || 999,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ product });
  } catch (err) {
    console.error('Catalog create error:', err);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
