'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EquipmentItem } from '@/types/booking';
import { formatPrice } from '@/content/equipment-catalog';
import { useCart } from '@/contexts/CartContext';
import PricingToggle from './PricingToggle';

interface EquipmentCatalogProps {
  studioRentals: EquipmentItem[];
  bundles: EquipmentItem[];
  alacarte: EquipmentItem[];
}

function getPrice(item: EquipmentItem, mode: 'in_studio' | 'out_of_studio'): number {
  return mode === 'in_studio' ? item.priceInStudio : item.priceOutOfStudio;
}

function PriceDisplay({ item, mode }: { item: EquipmentItem; mode: 'in_studio' | 'out_of_studio' }) {
  const price = getPrice(item, mode);

  if (item.included && mode === 'in_studio') {
    return <span className="text-sm font-medium text-brand-success">Included</span>;
  }

  if (price === 0 && mode === 'out_of_studio') {
    return <span className="text-sm text-brand-muted">Studio only</span>;
  }

  return <span className="text-lg font-bold text-brand-accent">{formatPrice(price)}</span>;
}

function AddToCartButton({ item, mode }: { item: EquipmentItem; mode: 'in_studio' | 'out_of_studio' }) {
  const { addItem, items, requiresAuth } = useCart();
  const router = useRouter();
  const price = getPrice(item, mode);
  const isInCart = items.some((i) => i.equipmentId === item.id);

  // Don't show button for included/studio-only items
  if ((item.included && mode === 'in_studio') || (price === 0 && mode === 'out_of_studio')) {
    return null;
  }

  if (requiresAuth) {
    return (
      <button
        onClick={() => router.push('/account/login?redirect=/equipment-rental')}
        className="mt-3 w-full rounded-md px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
      >
        Sign In to Add
      </button>
    );
  }

  return (
    <button
      onClick={() =>
        addItem({
          equipmentId: item.id,
          name: item.name,
          price,
          quantity: 1,
        })
      }
      className={`mt-3 w-full rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
        isInCart
          ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/30'
          : 'bg-brand-accent text-white hover:bg-brand-accent-hover'
      }`}
    >
      {isInCart ? 'In Cart — Add Another' : 'Add to Cart'}
    </button>
  );
}

export default function EquipmentCatalog({
  studioRentals,
  bundles,
  alacarte,
}: EquipmentCatalogProps) {
  const [mode, setMode] = useState<'in_studio' | 'out_of_studio'>('in_studio');

  return (
    <div className="space-y-16">
      {/* Toggle */}
      <div className="flex justify-center">
        <PricingToggle mode={mode} onChange={setMode} />
      </div>

      {/* Studio Rental */}
      {mode === 'in_studio' && (
        <div>
          <h3 className="font-display text-2xl font-bold text-brand-text">
            Studio Rental
          </h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {studioRentals.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-brand-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-sm text-brand-muted">{item.description}</p>
                <p className="mt-3 text-2xl font-bold text-brand-accent">
                  {formatPrice(item.priceInStudio)}
                </p>
                <p className="mt-1 text-sm text-brand-muted">
                  {item.name.split('—')[1]?.trim() ?? item.name}
                </p>
                <AddToCartButton item={item} mode={mode} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lighting Bundles */}
      <div>
        <h3 className="font-display text-2xl font-bold text-brand-text">
          Lighting Bundles
        </h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {bundles.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-brand-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h4 className="font-semibold text-brand-text">{item.name}</h4>
              {item.description && (
                <p className="mt-1 text-sm text-brand-muted">
                  {item.description}
                </p>
              )}
              <div className="mt-4">
                <PriceDisplay item={item} mode={mode} />
              </div>
              <AddToCartButton item={item} mode={mode} />
            </div>
          ))}
        </div>
      </div>

      {/* A La Carte */}
      <div>
        <h3 className="font-display text-2xl font-bold text-brand-text">
          A La Carte
        </h3>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {alacarte.map((item) => {
            const price = getPrice(item, mode);
            const isIncluded = item.included && mode === 'in_studio';
            const isStudioOnly = price === 0 && mode === 'out_of_studio';

            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-brand-border bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-brand-text">{item.name}</p>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-brand-muted">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 ml-4">
                  <PriceDisplay item={item} mode={mode} />
                  {!isIncluded && !isStudioOnly && (
                    <AddToCartButton item={item} mode={mode} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
