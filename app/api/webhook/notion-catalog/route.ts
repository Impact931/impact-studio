import { NextRequest, NextResponse } from 'next/server';
import {
  listProducts,
  createProduct,
  updateProduct,
  generateProductId,
} from '@/lib/catalog';
import { pullProductsFromNotion } from '@/lib/notion-catalog';

export const runtime = 'nodejs';

/**
 * POST /api/webhook/notion-catalog — Webhook to sync Notion Equipment DB → Site
 *
 * Called by Notion automation or n8n workflow when products are updated in Notion.
 * Protected by a shared secret in the Authorization header or query param.
 *
 * Usage:
 *   POST /api/webhook/notion-catalog
 *   Authorization: Bearer <WEBHOOK_SECRET>
 *
 *   Or: POST /api/webhook/notion-catalog?secret=<WEBHOOK_SECRET>
 */
export async function POST(req: NextRequest) {
  // Validate webhook secret
  const secret = process.env.NOTION_WEBHOOK_SECRET || process.env.EDITOR_PASSWORD;
  const authHeader = req.headers.get('authorization');
  const querySecret = req.nextUrl.searchParams.get('secret');
  const provided = authHeader?.replace('Bearer ', '') || querySecret;

  if (!provided || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const notionProducts = await pullProductsFromNotion();
    if (notionProducts.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        message: 'No products found in Notion Equipment DB',
      });
    }

    const existingProducts = await listProducts();
    const existingMap = new Map(existingProducts.map((p) => [p.productId, p]));

    const now = new Date().toISOString();
    let created = 0;
    let updated = 0;

    for (const np of notionProducts) {
      const existing = existingMap.get(np.productId);
      if (existing) {
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

    // Don't auto-delete DynamoDB products not found in Notion.
    // Only synced products (with Site Product ID) come back from pull,
    // so deletion would incorrectly remove products not yet pushed.

    return NextResponse.json({
      success: true,
      synced: created + updated,
      created,
      updated,
      timestamp: now,
    });
  } catch (err) {
    console.error('Notion webhook sync error:', err);
    return NextResponse.json(
      { error: 'Sync failed', details: String(err) },
      { status: 500 },
    );
  }
}
