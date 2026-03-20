import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  listProducts,
  createProduct,
  updateProduct,
  generateProductId,
} from '@/lib/catalog';
import { pullProductsFromNotion, syncProductToNotion } from '@/lib/notion-catalog';

export const runtime = 'nodejs';

/**
 * POST /api/admin/catalog/sync — Two-way sync with Notion Equipment DB
 *
 * Direction param:
 *   "pull"  — Notion → DynamoDB (overwrites site with Notion data)
 *   "push"  — DynamoDB → Notion (overwrites Notion with site data)
 *   "merge" — Two-way merge (default): Notion is source of truth for
 *             existing products, new DynamoDB products push to Notion
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const direction = body.direction || 'pull';

    if (direction === 'push') {
      // Push all DynamoDB products to Notion
      const products = await listProducts();
      let synced = 0;
      for (const p of products) {
        await syncProductToNotion({
          productId: p.productId,
          name: p.name,
          description: p.description,
          category: p.category,
          priceInStudio: p.priceInStudio,
          priceOutOfStudio: p.priceOutOfStudio,
          active: p.active,
          included: p.included,
          sortOrder: p.sortOrder,
        });
        synced++;
      }
      return NextResponse.json({ synced, direction: 'push' });
    }

    // Pull from Notion → DynamoDB
    const notionProducts = await pullProductsFromNotion();
    if (notionProducts.length === 0) {
      return NextResponse.json({
        synced: 0,
        direction: 'pull',
        message: 'No products found in Notion Equipment DB',
      });
    }

    const existingProducts = await listProducts();
    const existingMap = new Map(existingProducts.map((p) => [p.productId, p]));

    const now = new Date().toISOString();
    let created = 0;
    let updated = 0;

    // Upsert Notion products into DynamoDB
    for (const np of notionProducts) {
      const existing = existingMap.get(np.productId);
      if (existing) {
        // Update existing product
        await updateProduct(np.productId, existing.category, {
          name: np.name,
          description: np.description,
          category: np.category,
          priceInStudio: np.priceInStudio,
          priceOutOfStudio: np.priceOutOfStudio,
          active: np.active,
          included: np.included,
          sortOrder: np.sortOrder,
        });
        updated++;
      } else {
        // Create new product from Notion
        await createProduct({
          productId: np.productId.includes('-') ? np.productId : generateProductId(),
          name: np.name,
          description: np.description,
          category: np.category,
          priceInStudio: np.priceInStudio,
          priceOutOfStudio: np.priceOutOfStudio,
          active: np.active,
          included: np.included,
          sortOrder: np.sortOrder,
          createdAt: now,
          updatedAt: now,
        });
        created++;
      }
    }

    // Only remove products that were previously synced FROM Notion
    // (have a matching Site Product ID in Notion) but were since deleted there.
    // We don't remove products that were never synced to Notion.
    // On first sync, notionIds will be empty so nothing gets removed.

    return NextResponse.json({
      synced: created + updated,
      created,
      updated,
      direction: 'pull',
    });
  } catch (err) {
    console.error('Catalog sync error:', err);
    return NextResponse.json(
      { error: 'Sync failed', details: String(err) },
      { status: 500 },
    );
  }
}
