import { NextRequest, NextResponse } from 'next/server';
import {
  listProducts,
  createProduct,
  updateProduct,
  generateProductId,
} from '@/lib/catalog';

export const runtime = 'nodejs';

// Category mapping from Notion select values
const CATEGORY_FROM_NOTION: Record<string, string> = {
  'Studio Rentals': 'studio',
  'Lighting Bundles': 'bundle',
  'A La Carte': 'alacarte',
  'Add-ons': 'addon',
  'Lighting': 'alacarte',
  'Camera': 'alacarte',
  'Lens': 'alacarte',
  'Grip': 'alacarte',
  'Backdrop': 'alacarte',
  'Accessory': 'alacarte',
  'Modifier': 'alacarte',
  'Audio': 'addon',
  'Tether Equipment': 'alacarte',
  'Computer Accessory': 'alacarte',
  'Other': 'addon',
};

function extractRichText(prop: Record<string, unknown>): string {
  const rt = prop?.rich_text as Array<{ plain_text: string }> | undefined;
  return rt?.[0]?.plain_text || '';
}

function extractTitle(prop: Record<string, unknown>): string {
  const t = prop?.title as Array<{ plain_text: string }> | undefined;
  return t?.[0]?.plain_text || '';
}

/**
 * Parse a single product from Notion page properties.
 * Handles both:
 *  - Notion automation webhook payload (properties nested in data.properties)
 *  - Direct page object (properties at top level)
 */
function parseNotionProduct(properties: Record<string, unknown>) {
  const props = properties as Record<string, Record<string, unknown>>;

  const siteProductId = extractRichText(props['Site Product ID'] || {});
  const name = extractTitle(props['Item'] || {});
  const description = extractRichText(props['Description'] || {});
  const categorySelect = (props['Category'] as Record<string, Record<string, string>>)?.select?.name || '';
  const category = CATEGORY_FROM_NOTION[categorySelect] || 'alacarte';
  const inPrice = (props['In-Studio Price'] as Record<string, number>)?.number || 0;
  const outPrice = (props['Out-of-Studio Price'] as Record<string, number>)?.number || 0;
  const active = (props['Active'] as Record<string, boolean>)?.checkbox ?? true;
  const included = (props['Included In-Studio'] as Record<string, boolean>)?.checkbox ?? false;
  const sortOrder = (props['Sort Order'] as Record<string, number>)?.number ?? 999;

  return {
    siteProductId,
    name,
    description,
    category,
    priceInStudio: Math.round(inPrice * 100), // dollars → cents
    priceOutOfStudio: Math.round(outPrice * 100),
    active,
    included,
    sortOrder,
  };
}

/**
 * POST /api/webhook/notion-catalog — Notion button fires this webhook
 *
 * Accepts Notion automation "Send webhook" payload containing the page data.
 * Parses the record and upserts it into DynamoDB.
 *
 * Auth: secret query param or Authorization header.
 *
 * Notion automation setup:
 *   1. Add a Button property "Sync to Site" in your Equipment DB
 *   2. Configure automation: When button clicked → Send webhook
 *   3. URL: https://impactstudio931.com/api/webhook/notion-catalog?secret=YOUR_SECRET
 *   4. Include page properties in the webhook body
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
    const body = await req.json();

    // Notion automation sends: { data: { ... page object ... } }
    // The page object has: { id, properties, ... }
    const pageData = body.data || body;
    const properties = pageData.properties;

    if (!properties) {
      return NextResponse.json(
        { error: 'No properties found in payload. Expected Notion page data.' },
        { status: 400 },
      );
    }

    const product = parseNotionProduct(properties);

    if (!product.name) {
      return NextResponse.json(
        { error: 'Product name (Item) is required' },
        { status: 400 },
      );
    }

    // Look up existing product in DynamoDB
    const existingProducts = await listProducts();
    const now = new Date().toISOString();

    // If this record has a Site Product ID, find and update it
    if (product.siteProductId) {
      const existing = existingProducts.find((p) => p.productId === product.siteProductId);

      if (existing) {
        await updateProduct(product.siteProductId, existing.category, {
          name: product.name,
          description: product.description,
          category: product.category as 'studio' | 'bundle' | 'alacarte' | 'addon',
          priceInStudio: product.priceInStudio,
          priceOutOfStudio: product.priceOutOfStudio,
          active: product.active,
          included: product.included,
          sortOrder: product.sortOrder,
        });

        return NextResponse.json({
          success: true,
          action: 'updated',
          productId: product.siteProductId,
          name: product.name,
        });
      }
    }

    // No existing match — create new product
    const productId = product.siteProductId || generateProductId();
    await createProduct({
      productId,
      name: product.name,
      description: product.description,
      category: product.category as 'studio' | 'bundle' | 'alacarte' | 'addon',
      priceInStudio: product.priceInStudio,
      priceOutOfStudio: product.priceOutOfStudio,
      active: product.active,
      included: product.included,
      sortOrder: product.sortOrder,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      action: 'created',
      productId,
      name: product.name,
    });
  } catch (err) {
    console.error('Notion webhook error:', err);
    return NextResponse.json(
      { error: 'Sync failed', details: String(err) },
      { status: 500 },
    );
  }
}
