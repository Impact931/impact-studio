import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Impact Studio',
  description: 'Impact Studio privacy policy — how we collect, use, and protect your information.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-brand-text sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-3 text-sm text-brand-muted">Last updated: March 11, 2026</p>

      <div className="mt-12 space-y-10 text-sm leading-relaxed text-brand-muted">
        <section>
          <h2 className="font-display text-lg font-bold text-brand-text">1. Information We Collect</h2>
          <p className="mt-3">
            When you use Impact Studio&apos;s website or rent equipment, we may collect the following information:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Name, email address, phone number, and company name</li>
            <li>Payment information (processed securely through Stripe — we do not store card numbers)</li>
            <li>Insurance certificates and documentation</li>
            <li>Digital signatures for rental agreements</li>
            <li>Rental history and booking preferences</li>
            <li>Device information and browsing data through cookies</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-brand-text">2. How We Use Your Information</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Process equipment rentals and studio bookings</li>
            <li>Send booking confirmations, receipts, and operational communications</li>
            <li>Manage security deposits and insurance verification</li>
            <li>Improve our services and website experience</li>
            <li>Send studio newsletters and updates (with your consent)</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-brand-text">3. How We Share Your Information</h2>
          <p className="mt-3">
            We do not sell your personal information. We may share your data with:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong className="text-brand-text">Stripe</strong> — for secure payment processing</li>
            <li><strong className="text-brand-text">Amazon Web Services (AWS)</strong> — for data storage and email delivery</li>
            <li><strong className="text-brand-text">Service providers</strong> — who assist with business operations under strict data protection agreements</li>
            <li><strong className="text-brand-text">Legal authorities</strong> — when required by law or to protect our rights</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-brand-text">4. Use of AI and Automation</h2>
          <p className="mt-3">
            Impact Studio uses AI tools to assist with operations, content creation, and customer communications.
            See our <a href="/ai-policy" className="text-brand-accent underline">AI Policy</a> for full details
            on how we use AI and your rights regarding AI-processed data.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-brand-text">5. How We Protect Your Information</h2>
          <p className="mt-3">
            We implement industry-standard security measures including:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>SSL/TLS encryption for all data in transit</li>
            <li>PCI-DSS compliant payment processing through Stripe (card data never touches our servers)</li>
            <li>Encrypted data storage on AWS with access controls</li>
            <li>Regular security reviews and updates</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-brand-text">6. Cookies and Tracking</h2>
          <p className="mt-3">
            Our website uses cookies for essential functionality and, with your consent, analytics. You can manage your
            cookie preferences at any time. See our cookie consent banner for options.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-brand-text">7. Your Data Rights</h2>
          <p className="mt-3">You have the right to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Access your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data (subject to legal retention requirements)</li>
            <li>Opt out of marketing communications</li>
            <li>Request a copy of your data in a portable format</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-brand-text">8. Contact Us</h2>
          <p className="mt-3">
            For privacy-related questions or to exercise your data rights, contact us at:
          </p>
          <p className="mt-2">
            <strong className="text-brand-text">Impact Studio (JHR Photography LLC)</strong><br />
            2300 Rotary Park Dr, Suite A, Clarksville, TN 37043<br />
            <a href="mailto:info@impactstudio931.com" className="text-brand-accent">info@impactstudio931.com</a><br />
            <a href="tel:6152498096" className="text-brand-accent">615-249-8096</a>
          </p>
        </section>
      </div>
    </div>
  );
}
