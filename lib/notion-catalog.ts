// ---------------------------------------------------------------------------
// Notion Equipment DB — Two-Way Product Sync
// Equipment DB: 88e1f5e856044f589f9b626fca05ca9f
//
// Notion DB Schema (actual):
//   Item (title), Site Product ID (rich_text), Product ID (unique_id, read-only),
//   Description (rich_text), Category (select), In-Studio Price (number $),
//   Out-of-Studio Price (number $), Active (checkbox), Included In-Studio (checkbox),
//   Sort Order (number), Daily Rate (number), Brand (rich_text), Model (rich_text),
//   Serial (rich_text), Availability (status), Photos (files), Notes (rich_text),
//   Deposit (number), Requires Insurance (checkbox)
// ---------------------------------------------------------------------------

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const NOTION_VERSION = '2022-06-28';
const EQUIPMENT_DB = '88e1f5e856044f589f9b626fca05ca9f';

const headers: Record<string, string> = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  'Content-Type': 'application/json',
  'Notion-Version': NOTION_VERSION,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function notionPost(url: string, body: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.text();
    console.error('Notion catalog API error:', error);
    throw new Error(`Notion API error: ${response.status}`);
  }
  return response.json();
}

async function notionPatch(url: string, body: unknown) {
  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.text();
    console.error('Notion catalog API error:', error);
    throw new Error(`Notion API error: ${response.status}`);
  }
  return response.json();
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductSyncData {
  productId: string;
  name: string;
  description: string;
  category: string;
  priceInStudio: number;   // cents
  priceOutOfStudio: number; // cents
  active: boolean;
  included?: boolean;
  sortOrder: number;
}

interface NotionProduct {
  productId: string;
  name: string;
  description: string;
  category: 'studio' | 'bundle' | 'alacarte' | 'addon';
  priceInStudio: number;
  priceOutOfStudio: number;
  active: boolean;
  included: boolean;
  sortOrder: number;
  notionPageId: string;
}

// ---------------------------------------------------------------------------
// Category mapping
// ---------------------------------------------------------------------------

const CATEGORY_TO_NOTION: Record<string, string> = {
  studio: 'Studio Rentals',
  bundle: 'Lighting Bundles',
  alacarte: 'A La Carte',
  addon: 'Add-ons',
};

const CATEGORY_FROM_NOTION: Record<string, string> = {
  'Studio Rentals': 'studio',
  'Lighting Bundles': 'bundle',
  'A La Carte': 'alacarte',
  'Add-ons': 'addon',
  // Physical equipment categories map to alacarte by default
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

// ---------------------------------------------------------------------------
// Push to Notion (Site → Notion)
// ---------------------------------------------------------------------------

/** Find a product in Notion Equipment DB by Site Product ID */
async function findNotionProduct(productId: string): Promise<string | null> {
  try {
    const result = await notionPost(
      `https://api.notion.com/v1/databases/${EQUIPMENT_DB}/query`,
      {
        filter: {
          property: 'Site Product ID',
          rich_text: { equals: productId },
        },
        page_size: 1,
      },
    );
    return result.results?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

function buildProductProperties(data: ProductSyncData): Record<string, unknown> {
  return {
    // Title field is "Item" in this DB
    Item: { title: [{ text: { content: data.name } }] },
    // Our DynamoDB product ID stored as rich_text
    'Site Product ID': {
      rich_text: [{ text: { content: data.productId } }],
    },
    Description: {
      rich_text: [{ text: { content: data.description || '' } }],
    },
    Category: {
      select: { name: CATEGORY_TO_NOTION[data.category] || data.category },
    },
    'In-Studio Price': { number: data.priceInStudio / 100 },
    'Out-of-Studio Price': { number: data.priceOutOfStudio / 100 },
    Active: { checkbox: data.active },
    'Included In-Studio': { checkbox: data.included || false },
    'Sort Order': { number: data.sortOrder },
  };
}

/** Create or update a product in Notion Equipment DB */
export async function syncProductToNotion(data: ProductSyncData): Promise<string> {
  const existingPageId = await findNotionProduct(data.productId);
  const properties = buildProductProperties(data);

  if (existingPageId) {
    await notionPatch(`https://api.notion.com/v1/pages/${existingPageId}`, {
      properties,
    });
    return existingPageId;
  } else {
    const page = await notionPost('https://api.notion.com/v1/pages', {
      parent: { database_id: EQUIPMENT_DB },
      properties,
    });
    return page.id;
  }
}

/** Archive a product in Notion (soft delete) */
export async function archiveNotionProduct(productId: string): Promise<void> {
  const pageId = await findNotionProduct(productId);
  if (!pageId) return;

  await notionPatch(`https://api.notion.com/v1/pages/${pageId}`, {
    archived: true,
  });
}

// ---------------------------------------------------------------------------
// Pull from Notion (Notion → Site)
// ---------------------------------------------------------------------------

function extractRichText(prop: { rich_text?: Array<{ plain_text: string }> }): string {
  return prop?.rich_text?.[0]?.plain_text || '';
}

function extractTitle(prop: { title?: Array<{ plain_text: string }> }): string {
  return prop?.title?.[0]?.plain_text || '';
}

/**
 * Fetch rental products from Notion Equipment DB.
 * Only pulls items that have a Site Product ID (synced rental packages).
 * Physical inventory items (cameras, stands, etc.) are excluded.
 */
export async function pullProductsFromNotion(): Promise<NotionProduct[]> {
  const products: NotionProduct[] = [];
  let hasMore = true;
  let startCursor: string | undefined;

  while (hasMore) {
    const body: Record<string, unknown> = {
      page_size: 100,
      // Only pull items that have a Site Product ID (our rental packages)
      filter: {
        property: 'Site Product ID',
        rich_text: { is_not_empty: true },
      },
    };
    if (startCursor) body.start_cursor = startCursor;

    const result = await notionPost(
      `https://api.notion.com/v1/databases/${EQUIPMENT_DB}/query`,
      body,
    );

    for (const page of result.results) {
      if (page.archived) continue;

      const props = page.properties;
      const categorySelect = props?.Category?.select?.name || '';
      const siteProductId = extractRichText(props?.['Site Product ID']);

      products.push({
        productId: siteProductId,
        name: extractTitle(props?.Item) || 'Untitled',
        description: extractRichText(props?.Description),
        category: (CATEGORY_FROM_NOTION[categorySelect] || 'alacarte') as NotionProduct['category'],
        priceInStudio: Math.round((props?.['In-Studio Price']?.number || 0) * 100),
        priceOutOfStudio: Math.round((props?.['Out-of-Studio Price']?.number || 0) * 100),
        active: props?.Active?.checkbox ?? true,
        included: props?.['Included In-Studio']?.checkbox ?? false,
        sortOrder: props?.['Sort Order']?.number ?? 999,
        notionPageId: page.id,
      });
    }

    hasMore = result.has_more;
    startCursor = result.next_cursor;
  }

  return products.sort((a, b) => a.sortOrder - b.sortOrder);
}
