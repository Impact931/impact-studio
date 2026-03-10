import Link from 'next/link';
import EquipmentCatalog from '@/components/equipment/EquipmentCatalog';
import {
  STUDIO_RENTALS,
  LIGHTING_BUNDLES,
  ALACARTE_EQUIPMENT,
} from '@/content/equipment-catalog';

/* ---------- Studio Features Data ---------- */
const STUDIO_FEATURES = [
  {
    title: 'Cyclorama Wall',
    description: 'Seamless curved infinity wall for clean, professional backgrounds.',
  },
  {
    title: 'Multi-Roll Seamless Backgrounds',
    description: 'Multiple color options ready to drop for any shoot style.',
  },
  {
    title: 'Professional Lighting',
    description: 'Flashpoint strobes, softboxes, and modifiers for every setup.',
  },
  {
    title: 'Tethering Station',
    description: 'Laptop stand and tether cables for real-time image review.',
  },
  {
    title: 'High Ceilings',
    description: 'Generous vertical space for full-length and overhead lighting.',
  },
  {
    title: 'Open Production Floor',
    description: 'Flexible layout for photo, video, or multi-set productions.',
  },
];

export default function HomePage() {
  return (
    <>
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-black via-brand-dark to-brand-black">
        <div className="mx-auto max-w-4xl px-6 py-28 text-center sm:py-36">
          <h1 className="font-display text-4xl font-bold leading-tight text-brand-white sm:text-5xl lg:text-6xl">
            Professional Studio
            <br />
            &amp; Equipment Rental
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-muted">
            Clarksville&apos;s premier photography studio &mdash; cyclorama wall,
            pro lighting, and everything you need to create.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#equipment"
              className="rounded-full bg-brand-accent px-8 py-3 text-sm font-semibold text-brand-black transition-colors hover:bg-brand-accent-hover"
            >
              Browse Equipment
            </a>
            <Link
              href="/book"
              className="rounded-full border border-brand-border px-8 py-3 text-sm font-semibold text-brand-text transition-colors hover:border-brand-accent hover:text-brand-accent"
            >
              Book Now
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Equipment Catalog ===== */}
      <section id="equipment" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-center font-display text-3xl font-bold text-brand-white sm:text-4xl">
          Equipment &amp; Pricing
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-brand-muted">
          Everything you need for your next shoot, available in-studio or to take
          on location.
        </p>
        <div className="mt-12">
          <EquipmentCatalog
            studioRentals={STUDIO_RENTALS}
            bundles={LIGHTING_BUNDLES}
            alacarte={ALACARTE_EQUIPMENT}
          />
        </div>
      </section>

      {/* ===== Studio Features ===== */}
      <section className="border-t border-brand-border bg-brand-dark">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-center font-display text-3xl font-bold text-brand-white sm:text-4xl">
            The Studio
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {STUDIO_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-brand-border bg-brand-card p-6"
              >
                <h3 className="font-display text-lg font-semibold text-brand-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-brand-muted">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Policies ===== */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-center font-display text-3xl font-bold text-brand-white sm:text-4xl">
          Before You Book
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {/* Insurance */}
          <div className="rounded-xl border border-brand-border bg-brand-card p-6">
            <h3 className="font-display text-lg font-semibold text-brand-white">
              Insurance
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-brand-muted">
              A $1M general liability Certificate of Insurance (COI) naming
              JHR Photography LLC is required. No COI? A $500 refundable
              security hold is applied instead.
            </p>
          </div>

          {/* Cancellation */}
          <div className="rounded-xl border border-brand-border bg-brand-card p-6">
            <h3 className="font-display text-lg font-semibold text-brand-white">
              Cancellation
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-brand-muted">
              <li>
                <span className="text-brand-green">48+ hours:</span> Full refund
              </li>
              <li>
                <span className="text-brand-accent">24&ndash;48 hours:</span> 50% refund
              </li>
              <li>
                <span className="text-brand-red">&lt; 24 hours:</span> No refund
              </li>
            </ul>
          </div>

          {/* What's Included */}
          <div className="rounded-xl border border-brand-border bg-brand-card p-6">
            <h3 className="font-display text-lg font-semibold text-brand-white">
              What&apos;s Included
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-brand-muted">
              <li>Grip equipment &amp; sandbags</li>
              <li>Extension cables &amp; power strips</li>
              <li>Studio Wi-Fi</li>
              <li>Climate-controlled space</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="border-t border-brand-border bg-brand-dark">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="font-display text-3xl font-bold text-brand-white sm:text-4xl">
            Ready to Create?
          </h2>
          <p className="mt-4 text-lg text-brand-muted">
            Book your studio time and equipment today.
          </p>
          <Link
            href="/book"
            className="mt-8 inline-block rounded-full bg-brand-accent px-10 py-4 text-base font-semibold text-brand-black transition-colors hover:bg-brand-accent-hover"
          >
            Book Equipment
          </Link>
        </div>
      </section>
    </>
  );
}
