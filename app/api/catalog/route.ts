import { NextResponse } from 'next/server';
import { listProducts } from '@/lib/catalog';

export const runtime = 'nodejs';

/**
 * GET /api/catalog — Public product catalog (no auth required)
 * Returns active products grouped by category for the storefront.
 * Falls back gracefully if DynamoDB is empty (client uses static data).
 */
export async function GET() {
  try {
    const products = await listProducts();
    const active = products.filter((p) => p.active);

    // Map to EquipmentItem shape for the frontend
    const items = active.map((p) => ({
      id: p.productId,
      name: p.name,
      category: p.category,
      priceInStudio: p.priceInStudio,
      priceOutOfStudio: p.priceOutOfStudio,
      description: p.description || undefined,
      included: p.included || undefined,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error('Public catalog error:', err);
    // Return empty so client falls back to static data
    return NextResponse.json({ items: [] });
  }
}
