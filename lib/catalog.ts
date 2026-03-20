/**
 * Product Catalog Service Layer
 * DynamoDB CRUD operations for equipment/product management
 */

import { randomUUID } from 'crypto';
import { putItem, getItem, scanItems, updateItem, deleteItem } from './dynamodb';

export interface CatalogProduct {
  PK: string;
  SK: string;
  productId: string;
  name: string;
  description: string;
  category: 'studio' | 'bundle' | 'alacarte' | 'addon';
  priceInStudio: number;   // cents
  priceOutOfStudio: number; // cents
  image?: string;
  active: boolean;
  included?: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export function generateProductId(): string {
  return randomUUID();
}

export async function createProduct(
  data: Omit<CatalogProduct, 'PK' | 'SK'>,
): Promise<CatalogProduct> {
  const record: CatalogProduct = {
    ...data,
    PK: `PRODUCT#${data.productId}`,
    SK: `CAT#${data.category}`,
  };
  await putItem(record as unknown as Record<string, unknown>);
  return record;
}

export async function getProduct(
  productId: string,
): Promise<CatalogProduct | null> {
  // We need to scan since SK varies by category
  const items = await scanItems(
    'PK = :pk',
    { ':pk': `PRODUCT#${productId}` },
  );
  const record = items[0] as unknown as CatalogProduct | undefined;
  return record ?? null;
}

export async function updateProduct(
  productId: string,
  category: string,
  updates: Partial<CatalogProduct>,
): Promise<void> {
  const safeUpdates = { ...updates, updatedAt: new Date().toISOString() };
  delete (safeUpdates as Record<string, unknown>).PK;
  delete (safeUpdates as Record<string, unknown>).SK;
  await updateItem(`PRODUCT#${productId}`, `CAT#${category}`, safeUpdates);
}

export async function deleteProduct(
  productId: string,
  category: string,
): Promise<void> {
  await deleteItem(`PRODUCT#${productId}`, `CAT#${category}`);
}

export async function listProducts(): Promise<CatalogProduct[]> {
  const items = await scanItems(
    'begins_with(PK, :pk)',
    { ':pk': 'PRODUCT#' },
  );
  return (items as unknown as CatalogProduct[]).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

export async function listProductsByCategory(
  category: string,
): Promise<CatalogProduct[]> {
  const items = await scanItems(
    'begins_with(PK, :pk) AND SK = :sk',
    { ':pk': 'PRODUCT#', ':sk': `CAT#${category}` },
  );
  return (items as unknown as CatalogProduct[]).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

/**
 * Seed the catalog from static data if no products exist in DynamoDB.
 */
export async function seedCatalogIfEmpty(): Promise<boolean> {
  const existing = await listProducts();
  if (existing.length > 0) return false;

  // Import static catalog
  const {
    STUDIO_RENTALS,
    LIGHTING_BUNDLES,
    ALACARTE_EQUIPMENT,
    ADDONS,
  } = await import('@/content/equipment-catalog');

  const allItems = [
    ...STUDIO_RENTALS.map((item, i) => ({ ...item, sortOrder: i })),
    ...LIGHTING_BUNDLES.map((item, i) => ({ ...item, sortOrder: 100 + i })),
    ...ALACARTE_EQUIPMENT.map((item, i) => ({ ...item, sortOrder: 200 + i })),
    ...ADDONS.map((item, i) => ({ ...item, sortOrder: 300 + i })),
  ];

  const now = new Date().toISOString();
  for (const item of allItems) {
    await createProduct({
      productId: item.id,
      name: item.name,
      description: item.description || '',
      category: item.category,
      priceInStudio: item.priceInStudio,
      priceOutOfStudio: item.priceOutOfStudio,
      active: true,
      included: item.included || false,
      sortOrder: item.sortOrder,
      createdAt: now,
      updatedAt: now,
    });
  }

  return true;
}
