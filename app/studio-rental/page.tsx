import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Studio Rental | Impact Studio',
  description: 'Book our professional photography studio in Clarksville, TN. Cyclorama wall, seamless backgrounds, professional lighting. Hourly, half-day, and full-day packages.',
};

const PACKAGES = [
  {
    name: 'Hourly',
    price: '$75',
    unit: '/hour',
    description: 'Perfect for quick headshot sessions and product photography.',
    features: ['Studio access', 'Wi-Fi & power', 'Grip equipment included'],
  },
  {
    name: 'Half Day',
    price: '$260',
    unit: '4 hours',
    description: 'Ideal for portrait sessions, small team headshots, and content creation.',
    features: ['4-hour block', 'Wi-Fi & power', 'Grip equipment included', 'Setup & teardown time'],
    popular: true,
  },
  {
    name: 'Full Day',
    price: '$480',
    unit: '8 hours',
    description: 'Best value for larger productions, video shoots, and multi-set days.',
    features: ['8-hour block', 'Wi-Fi & power', 'Grip equipment included', 'Multiple set changes', 'Full flexibility'],
  },
];

const STUDIO_FEATURES = [
  'Cyclorama infinity wall',
  'Multi-roll seamless backgrounds',
  'High ceilings for overhead lighting',
  'Climate-controlled environment',
  'Studio Wi-Fi',
  'Grip equipment & sandbags',
  'Extension cables & power strips',
  'Flexible open floor plan',
];

export default function StudioRentalPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-brand-dark">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">
            Studio Rental
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            Professional studio space with cyclorama wall, seamless backgrounds,
            and everything you need. Hourly, half-day, and full-day packages.
          </p>
        </div>
      </section>

      {/* Packages */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-center font-display text-3xl font-bold text-brand-text">
          Studio Packages
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.name}
              className={`relative rounded-xl border bg-white p-8 shadow-sm ${
                pkg.popular
                  ? 'border-brand-accent ring-2 ring-brand-accent/20'
                  : 'border-brand-border'
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-accent px-4 py-1 text-xs font-semibold text-white">
                  Most Popular
                </span>
              )}
              <h3 className="font-display text-xl font-bold text-brand-text">{pkg.name}</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-brand-accent">{pkg.price}</span>
                <span className="ml-1 text-sm text-brand-muted">{pkg.unit}</span>
              </div>
              <p className="mt-3 text-sm text-brand-muted">{pkg.description}</p>
              <ul className="mt-6 space-y-2">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-brand-muted">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-success" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/book"
                className="mt-8 block rounded-lg bg-brand-accent px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-accent-hover"
              >
                Book {pkg.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* What's Included */}
      <section className="bg-brand-light">
        <div className="mx-auto max-w-4xl px-6 py-24">
          <h2 className="text-center font-display text-3xl font-bold text-brand-text">
            What&apos;s Included
          </h2>
          <div className="mt-12 grid gap-3 sm:grid-cols-2">
            {STUDIO_FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-3 rounded-lg border border-brand-border bg-white px-5 py-4 shadow-sm">
                <svg className="h-5 w-5 shrink-0 text-brand-success" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-brand-text">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-on Equipment */}
      <section className="mx-auto max-w-4xl px-6 py-24">
        <h2 className="text-center font-display text-3xl font-bold text-brand-text">
          Add Lighting &amp; Equipment
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-brand-muted">
          Enhance your studio session with professional lighting bundles and a la carte gear.
          Equipment is priced at discounted in-studio rates when booked with studio time.
        </p>
        <div className="mt-8 text-center">
          <Link
            href="/equipment-rental"
            className="text-sm font-semibold text-brand-accent transition-colors hover:text-brand-accent-hover"
          >
            Browse Equipment Catalog &rarr;
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-dark">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="font-display text-3xl font-bold text-white">
            Book Your Session
          </h2>
          <p className="mt-4 text-gray-400">
            Reserve your studio time and start creating.
          </p>
          <Link
            href="/book"
            className="mt-8 inline-block rounded-full bg-brand-accent px-10 py-4 text-base font-semibold text-white transition-colors hover:bg-brand-accent-hover"
          >
            Book Now
          </Link>
        </div>
      </section>
    </>
  );
}
