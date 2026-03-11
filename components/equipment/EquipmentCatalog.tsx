'use client';

import { useState } from 'react';
import { EquipmentItem } from '@/types/booking';
import { formatPrice } from '@/content/equipment-catalog';
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
          {alacarte.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-brand-border bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div>
                <p className="font-medium text-brand-text">{item.name}</p>
                {item.description && (
                  <p className="mt-0.5 text-xs text-brand-muted">
                    {item.description}
                  </p>
                )}
              </div>
              <PriceDisplay item={item} mode={mode} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
