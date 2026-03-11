import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | Impact Studio',
  description: 'Learn about Impact Studio — Clarksville\'s premier photography studio and equipment rental space, powered by JHR Photography LLC.',
};

const STATS = [
  { label: 'Studio Space', value: '1,200 sq ft' },
  { label: 'Equipment Items', value: '30+' },
  { label: 'Open Hours', value: '7AM–11PM' },
  { label: 'Days Per Week', value: '7' },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-brand-dark">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">
            About Impact Studio
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            A creative space built for photographers, videographers, and content creators.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h2 className="font-display text-3xl font-bold text-brand-text">Our Story</h2>
        <div className="mt-6 space-y-4 text-brand-muted leading-relaxed">
          <p>
            Impact Studio was born from a simple idea: every creator deserves access to
            professional-grade equipment and studio space without the overhead of owning it all.
          </p>
          <p>
            Founded by JHR Photography LLC — a Nashville-based event, tradeshow, and headshot
            media agency — Impact Studio brings the same level of professionalism and reliability
            that JHR delivers to Fortune 500 clients, but in a space designed for the broader
            creative community.
          </p>
          <p>
            Located in Clarksville, Tennessee, our studio features a cyclorama wall, multiple
            seamless background options, professional Flashpoint lighting systems, and everything
            you need to walk in and start creating. Whether you&apos;re shooting corporate headshots,
            fashion editorials, product photography, or video content — we have you covered.
          </p>
          <p>
            Our mission is simple: <strong className="text-brand-text">remove uncertainty</strong>.
            When you rent from Impact Studio, you get professional equipment that works, a clean
            and well-maintained space, and a team that understands what creators need.
          </p>
        </div>
      </section>

      {/* The Space */}
      <section className="bg-brand-light">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-center font-display text-3xl font-bold text-brand-text">
            The Space
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Cyclorama Wall', desc: 'Seamless curved infinity wall for clean backgrounds — perfect for headshots, portraits, and product photography.' },
              { title: 'Multi-Roll Backgrounds', desc: 'Multiple seamless paper rolls in various colors, ready to drop at a moment\'s notice.' },
              { title: 'Professional Lighting', desc: 'Flashpoint 400 and 600 series strobes with a full range of modifiers — softboxes, strip lights, and beauty dishes.' },
              { title: 'Tethering Station', desc: 'Dedicated laptop stand with tether cables for real-time image review during your shoot.' },
              { title: 'High Ceilings', desc: 'Generous vertical space accommodates full-length portraits, overhead lighting rigs, and creative setups.' },
              { title: 'Climate Controlled', desc: 'Comfortable year-round temperature with studio Wi-Fi, power, and grip equipment included.' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-brand-border bg-white p-6 shadow-sm">
                <h3 className="font-display text-lg font-semibold text-brand-text">{item.title}</h3>
                <p className="mt-2 text-sm text-brand-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-4xl px-6 py-24">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-3xl font-bold text-brand-accent">{stat.value}</p>
              <p className="mt-1 text-sm text-brand-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-dark">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="font-display text-3xl font-bold text-white">
            Ready to See the Space?
          </h2>
          <p className="mt-4 text-gray-400">
            Book a studio session or rent equipment today.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/studio-rental"
              className="rounded-full bg-brand-accent px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-accent-hover"
            >
              Book Studio
            </Link>
            <Link
              href="/equipment-rental"
              className="rounded-full border border-gray-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:border-brand-accent hover:text-brand-accent"
            >
              Rent Equipment
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
