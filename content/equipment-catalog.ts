import { EquipmentItem } from '@/types/booking';

// ---------------------------------------------------------------------------
// Studio Rental Options
// ---------------------------------------------------------------------------
export const STUDIO_RENTALS: EquipmentItem[] = [
  {
    id: 'studio-hourly',
    name: 'Studio Rental — Hourly',
    category: 'studio',
    priceInStudio: 7500,
    priceOutOfStudio: 0,
    description: 'Per-hour studio rental',
  },
  {
    id: 'studio-half-day',
    name: 'Studio Rental — Half Day (4 hours)',
    category: 'studio',
    priceInStudio: 26000,
    priceOutOfStudio: 0,
    description: '4-hour block studio rental',
  },
  {
    id: 'studio-full-day',
    name: 'Studio Rental — Full Day (8 hours)',
    category: 'studio',
    priceInStudio: 48000,
    priceOutOfStudio: 0,
    description: '8-hour block studio rental',
  },
];

// ---------------------------------------------------------------------------
// Lighting Bundles
// ---------------------------------------------------------------------------
export const LIGHTING_BUNDLES: EquipmentItem[] = [
  {
    id: 'bundle-standard-lightbox',
    name: 'Standard Light Box Setup',
    category: 'bundle',
    priceInStudio: 3500,
    priceOutOfStudio: 8500,
    description: 'Single light box with stand and modifier',
  },
  {
    id: 'bundle-double-lightbox',
    name: 'Double Light Box Setup',
    category: 'bundle',
    priceInStudio: 7500,
    priceOutOfStudio: 16500,
    description: 'Two light boxes with stands and modifiers',
  },
  {
    id: 'bundle-headshot-kit-1',
    name: 'Headshot Kit 1',
    category: 'bundle',
    priceInStudio: 4500,
    priceOutOfStudio: 9900,
    description: 'Essential headshot lighting kit',
  },
  {
    id: 'bundle-headshot-kit-2',
    name: 'Headshot Kit 2',
    category: 'bundle',
    priceInStudio: 6000,
    priceOutOfStudio: 13500,
    description: 'Premium headshot lighting kit with extra modifiers',
  },
];

// ---------------------------------------------------------------------------
// A La Carte Equipment
// ---------------------------------------------------------------------------
export const ALACARTE_EQUIPMENT: EquipmentItem[] = [
  {
    id: 'alacarte-strobe',
    name: 'Flashpoint 400/600 Strobe',
    category: 'alacarte',
    priceInStudio: 1500,
    priceOutOfStudio: 3500,
  },
  {
    id: 'alacarte-light-stand',
    name: 'Manfrotto Light Stand',
    category: 'alacarte',
    priceInStudio: 0,
    priceOutOfStudio: 1000,
    included: true,
    description: 'Included in-studio — rental required for out-of-studio',
  },
  {
    id: 'alacarte-octa-softbox',
    name: '48" Octa Softbox',
    category: 'alacarte',
    priceInStudio: 1000,
    priceOutOfStudio: 2000,
  },
  {
    id: 'alacarte-strip-light',
    name: 'Strip Light Modifier',
    category: 'alacarte',
    priceInStudio: 1000,
    priceOutOfStudio: 2000,
  },
  {
    id: 'alacarte-reflector',
    name: 'Lastolite Reflector',
    category: 'alacarte',
    priceInStudio: 800,
    priceOutOfStudio: 1500,
  },
  {
    id: 'alacarte-xdrop-background',
    name: 'X-Drop Background System',
    category: 'alacarte',
    priceInStudio: 1500,
    priceOutOfStudio: 3000,
  },
  {
    id: 'alacarte-tripod',
    name: 'Tripod',
    category: 'alacarte',
    priceInStudio: 1000,
    priceOutOfStudio: 2000,
  },
  {
    id: 'alacarte-tripod-dolly',
    name: 'Tripod Dolly',
    category: 'alacarte',
    priceInStudio: 1000,
    priceOutOfStudio: 2000,
  },
  {
    id: 'alacarte-tether-cable',
    name: 'Tether Cable',
    category: 'alacarte',
    priceInStudio: 500,
    priceOutOfStudio: 1000,
  },
  {
    id: 'alacarte-laptop-stand',
    name: 'Laptop Stand (Oben TLSP)',
    category: 'alacarte',
    priceInStudio: 1000,
    priceOutOfStudio: 2000,
  },
];

// ---------------------------------------------------------------------------
// Add-ons
// ---------------------------------------------------------------------------
export const ADDONS: EquipmentItem[] = [
  {
    id: 'addon-damage-waiver',
    name: 'Damage Waiver',
    category: 'addon',
    priceInStudio: 2000,
    priceOutOfStudio: 2000,
    description: 'Covers minor accidental damage to rented equipment',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns every equipment item across all categories. */
export function getAllEquipment(): EquipmentItem[] {
  return [
    ...STUDIO_RENTALS,
    ...LIGHTING_BUNDLES,
    ...ALACARTE_EQUIPMENT,
    ...ADDONS,
  ];
}

/** Formats a price in cents to a dollar string (e.g. 7500 -> "$75.00"). */
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toFixed(2)}`;
}
