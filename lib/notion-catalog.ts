// ---------------------------------------------------------------------------
// Notion Equipment DB — Two-Way Product Sync
// Equipment DB: 88e1f5e856044f589f9b626fca05ca9f
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
// Push to Notion (Site → Notion)
// ---------------------------------------------------------------------------

/** Find a product in Notion Equipment DB by productId */
async function findNotionProduct(productId: string): Promise<string | null> {
  try {
    const result = await notionPost(
      `https://api.notion.com/v1/databases/${EQUIPMENT_DB}/query`,
      {
        filter: {
          property: 'Product ID',
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
  const CATEGORY_LABELS: Record<string, string> = {
    studio: 'Studio Rentals',
    bundle: 'Lighting Bundles',
    alacarte: 'A La Carte',
    addon: 'Add-ons',
  };

  return {
    Name: { title: [{ text: { content: data.name } }] },
    'Product ID': {
      rich_text: [{ text: { content: data.productId } }],
    },
    Description: {
      rich_text: [{ text: { content: data.description || '' } }],
    },
    Category: {
      select: { name: CATEGORY_LABELS[data.category] || data.category },
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

const CATEGORY_REVERSE: Record<string, string> = {
  'Studio Rentals': 'studio',
  'Lighting Bundles': 'bundle',
  'A La Carte': 'alacarte',
  'Add-ons': 'addon',
};

/** Fetch all products from Notion Equipment DB */
export async function pullProductsFromNotion(): Promise<NotionProduct[]> {
  const products: NotionProduct[] = [];
  let hasMore = true;
  let startCursor: string | undefined;

  while (hasMore) {
    const body: Record<string, unknown> = { page_size: 100 };
    if (startCursor) body.start_cursor = startCursor;

    const result = await notionPost(
      `https://api.notion.com/v1/databases/${EQUIPMENT_DB}/query`,
      body,
    );

    for (const page of result.results) {
      const props = page.properties;
      const categorySelect = props?.Category?.select?.name || '';

      products.push({
        productId: extractRichText(props?.['Product ID']) || page.id,
        name: extractTitle(props?.Name) || 'Untitled',
        description: extractRichText(props?.Description),
        category: (CATEGORY_REVERSE[categorySelect] || 'alacarte') as NotionProduct['category'],
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
