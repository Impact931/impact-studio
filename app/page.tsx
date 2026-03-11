import Link from 'next/link';
import EquipmentCatalog from '@/components/equipment/EquipmentCatalog';
import {
  STUDIO_RENTALS,
  LIGHTING_BUNDLES,
  ALACARTE_EQUIPMENT,
} from '@/content/equipment-catalog';

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

const HOW_IT_WORKS = [
  { step: '1', title: 'Select', description: 'Browse our equipment catalog and studio packages. Add what you need to your cart.' },
  { step: '2', title: 'Book', description: 'Choose your rental dates, sign the agreement, and complete checkout securely.' },
  { step: '3', title: 'Create', description: 'Pick up your gear and create something amazing. We handle the rest.' },
];

export default function HomePage() {
  return (
    <>
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-brand-dark">
        <div className="mx-auto max-w-4xl px-6 py-28 text-center sm:py-36">
          <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Professional Studio
            <br />
            &amp; Equipment Rental
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
            Clarksville&apos;s premier photography studio &mdash; cyclorama wall,
            pro lighting, and everything you need to create.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/studio-rental"
              className="rounded-full bg-brand-accent px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-accent-hover"
            >
              Studio Rental
            </Link>
            <Link
              href="/equipment-rental"
              className="rounded-full border border-gray-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:border-brand-accent hover:text-brand-accent"
            >
              Equipment Rental
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Services Overview ===== */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-center font-display text-3xl font-bold text-brand-text sm:text-4xl">
          What We Offer
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          <div className="rounded-xl border border-brand-border bg-white p-8 shadow-sm">
            <h3 className="font-display text-xl font-bold text-brand-text">
              Studio Rental
            </h3>
            <p className="mt-3 text-brand-muted">
              Book our professional studio space with cyclorama wall, seamless
              backgrounds, and climate-controlled environment. Hourly, half-day,
              and full-day packages available.
            </p>
            <p className="mt-4 text-2xl font-bold text-brand-accent">From $75/hr</p>
            <Link
              href="/studio-rental"
              className="mt-6 inline-block text-sm font-semibold text-brand-accent transition-colors hover:text-brand-accent-hover"
            >
              View Studio Details &rarr;
            </Link>
          </div>
          <div className="rounded-xl border border-brand-border bg-white p-8 shadow-sm">
            <h3 className="font-display text-xl font-bold text-brand-text">
              Equipment Rental
            </h3>
            <p className="mt-3 text-brand-muted">
              Professional lighting, grip, camera support, and accessories. Rent
              individual items or bundles for in-studio or on-location shoots.
            </p>
            <p className="mt-4 text-2xl font-bold text-brand-accent">Starting at $5/day</p>
            <Link
              href="/equipment-rental"
              className="mt-6 inline-block text-sm font-semibold text-brand-accent transition-colors hover:text-brand-accent-hover"
            >
              Browse Equipment &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Equipment Catalog Preview ===== */}
      <section id="equipment" className="bg-brand-light">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-center font-display text-3xl font-bold text-brand-text sm:text-4xl">
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
        </div>
      </section>

      {/* ===== Studio Features ===== */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-center font-display text-3xl font-bold text-brand-text sm:text-4xl">
          The Studio
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STUDIO_FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-brand-border bg-white p-6 shadow-sm"
            >
              <h3 className="font-display text-lg font-semibold text-brand-text">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-brand-muted">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== How It Works ===== */}
      <section className="bg-brand-light">
        <div className="mx-auto max-w-4xl px-6 py-24">
          <h2 className="text-center font-display text-3xl font-bold text-brand-text sm:text-4xl">
            How It Works
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-accent text-xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-brand-text">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-brand-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Policies Overview ===== */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-center font-display text-3xl font-bold text-brand-text sm:text-4xl">
          Before You Book
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-brand-border bg-white p-6 shadow-sm">
            <h3 className="font-display text-lg font-semibold text-brand-text">
              Insurance
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-brand-muted">
              A $1M general liability Certificate of Insurance (COI) naming
              JHR Photography LLC is required for rentals over $15,000 replacement value.
              No COI? A security deposit hold is applied instead.
            </p>
          </div>

          <div className="rounded-xl border border-brand-border bg-white p-6 shadow-sm">
            <h3 className="font-display text-lg font-semibold text-brand-text">
              Cancellation
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-brand-muted">
              <li>
                <span className="font-medium text-brand-success">7+ days:</span> Full refund (minus $25 fee)
              </li>
              <li>
                <span className="font-medium text-brand-accent">48hrs &ndash; 7 days:</span> 50% refund
              </li>
              <li>
                <span className="font-medium text-brand-red">Under 48 hours:</span> No refund
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-brand-border bg-white p-6 shadow-sm">
            <h3 className="font-display text-lg font-semibold text-brand-text">
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
        <div className="mt-8 text-center">
          <Link
            href="/policies"
            className="text-sm font-semibold text-brand-accent transition-colors hover:text-brand-accent-hover"
          >
            Read Full Rental Policies &rarr;
          </Link>
        </div>
      </section>

      {/* ===== Location ===== */}
      <section className="bg-brand-light">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-center font-display text-3xl font-bold text-brand-text sm:text-4xl">
            Visit the Studio
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="font-display text-lg font-semibold text-brand-text">Location</h3>
              <p className="mt-2 text-brand-muted">
                2300 Rotary Park Dr, Suite A<br />
                Clarksville, TN 37043
              </p>
              <h3 className="mt-6 font-display text-lg font-semibold text-brand-text">Hours</h3>
              <p className="mt-2 text-brand-muted">
                7:00 AM &ndash; 11:00 PM<br />
                Seven days a week
              </p>
              <h3 className="mt-6 font-display text-lg font-semibold text-brand-text">Contact</h3>
              <p className="mt-2 text-brand-muted">
                <a href="tel:6152498096" className="hover:text-brand-accent">615-249-8096</a>
                <br />
                <a href="mailto:info@impactstudio931.com" className="hover:text-brand-accent">info@impactstudio931.com</a>
              </p>
            </div>
            <div className="overflow-hidden rounded-xl border border-brand-border">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3218.5!2d-87.3!3d36.5!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzYuNQ!5e0!3m2!1sen!2sus!4v1"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Impact Studio Location"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="bg-brand-dark">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Ready to Create?
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Book your studio time and equipment today.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/studio-rental"
              className="rounded-full bg-brand-accent px-10 py-4 text-base font-semibold text-white transition-colors hover:bg-brand-accent-hover"
            >
              Book Studio
            </Link>
            <Link
              href="/equipment-rental"
              className="rounded-full border border-gray-600 px-10 py-4 text-base font-semibold text-white transition-colors hover:border-brand-accent hover:text-brand-accent"
            >
              Rent Equipment
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
