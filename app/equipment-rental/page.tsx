import Link from 'next/link';
import type { Metadata } from 'next';
import EquipmentCatalog from '@/components/equipment/EquipmentCatalog';
import {
  STUDIO_RENTALS,
  LIGHTING_BUNDLES,
  ALACARTE_EQUIPMENT,
} from '@/content/equipment-catalog';

export const metadata: Metadata = {
  title: 'Equipment Rental | Impact Studio',
  description: 'Browse and rent professional photography equipment — lighting bundles, strobes, modifiers, grip gear, and more. In-studio and out-of-studio pricing available.',
};

export default function EquipmentRentalPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-brand-dark">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">
            Equipment Rental
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            Professional lighting, grip, and camera support equipment. Rent individual items or bundles for in-studio or on-location shoots.
          </p>
        </div>
      </section>

      {/* Equipment Catalog */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <EquipmentCatalog
          studioRentals={STUDIO_RENTALS}
          bundles={LIGHTING_BUNDLES}
          alacarte={ALACARTE_EQUIPMENT}
        />
      </section>

      {/* Booking CTA */}
      <section className="bg-brand-light">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="font-display text-2xl font-bold text-brand-text">
            Ready to Rent?
          </h2>
          <p className="mt-3 text-brand-muted">
            Select your equipment and complete checkout in just a few steps.
          </p>
          <Link
            href="/book"
            className="mt-6 inline-block rounded-full bg-brand-accent px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-accent-hover"
          >
            Start Booking
          </Link>
        </div>
      </section>

      {/* Policies Summary */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h3 className="font-display text-xl font-bold text-brand-text">Good to Know</h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-brand-text">Insurance</h4>
            <p className="mt-2 text-xs text-brand-muted">
              COI required for rentals over $15K replacement value. No COI? Security deposit hold applies.
            </p>
          </div>
          <div className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-brand-text">Returns</h4>
            <p className="mt-2 text-xs text-brand-muted">
              Equipment must be returned clean and in its case. Late returns charged at the full daily rate.
            </p>
          </div>
          <div className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-brand-text">Cancellation</h4>
            <p className="mt-2 text-xs text-brand-muted">
              Full refund (minus $25 fee) with 7+ days notice. See our{' '}
              <Link href="/policies" className="text-brand-accent underline">policies</Link> for details.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
