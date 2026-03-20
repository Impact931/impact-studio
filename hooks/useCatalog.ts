'use client';

import { useState, useEffect } from 'react';
import { EquipmentItem } from '@/types/booking';
import {
  STUDIO_RENTALS,
  LIGHTING_BUNDLES,
  ALACARTE_EQUIPMENT,
} from '@/content/equipment-catalog';

interface CatalogData {
  studioRentals: EquipmentItem[];
  bundles: EquipmentItem[];
  alacarte: EquipmentItem[];
  loading: boolean;
}

/**
 * Fetches the product catalog from DynamoDB via /api/catalog.
 * Falls back to static data if the API returns empty or errors.
 */
export function useCatalog(): CatalogData {
  const [data, setData] = useState<CatalogData>({
    studioRentals: STUDIO_RENTALS,
    bundles: LIGHTING_BUNDLES,
    alacarte: ALACARTE_EQUIPMENT,
    loading: true,
  });

  useEffect(() => {
    fetch('/api/catalog')
      .then((r) => r.json())
      .then((res) => {
        const items: EquipmentItem[] = res.items || [];
        if (items.length === 0) {
          // DynamoDB empty — keep static fallback
          setData((prev) => ({ ...prev, loading: false }));
          return;
        }

        setData({
          studioRentals: items.filter((i) => i.category === 'studio'),
          bundles: items.filter((i) => i.category === 'bundle'),
          alacarte: items.filter((i) => i.category === 'alacarte'),
          loading: false,
        });
      })
      .catch(() => {
        // Network error — keep static fallback
        setData((prev) => ({ ...prev, loading: false }));
      });
  }, []);

  return data;
}
