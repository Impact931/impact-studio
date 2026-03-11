import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Policy | Impact Studio',
  description: 'How Impact Studio uses AI in operations, content, and customer interactions.',
};

export default function AIPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-brand-text sm:text-4xl">
        AI Transparency Policy
      </h1>
      <p className="mt-3 text-sm text-brand-muted">Last updated: March 11, 2026</p>

      <div className="mt-12 space-y-10 text-sm leading-relaxed text-brand-muted">
        <section>
          <h2 className="font-display text-lg font-bold text-brand-text">How We Use AI</h2>
          <p className="mt-3">
            Impact Studio (a JHR Photography LLC studio) uses artificial intelligence tools to enhance
            our operations and improve the customer experience. We believe in being transparent about
            how these tools are used.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-brand-text">AI in Our Operations</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li><strong className="text-brand-text">Content Creation:</strong> Some website content, marketing materials, and communications may be created or assisted by AI tools, then reviewed by our team for accuracy and brand alignment.</li>
            <li><strong className="text-brand-text">Customer Communications:</strong> AI may assist in drafting email templates and operational notifications. All customer-facing communications are reviewed before sending.</li>
            <li><strong className="text-brand-text">Business Operations:</strong> AI tools help with scheduling, inventory management, and workflow automation to provide faster and more reliable service.</li>
            <li><strong className="text-brand-text">Website Development:</strong> AI assists in building and maintaining our website and booking systems.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-brand-text">Your Data and AI</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>We do <strong className="text-brand-text">not</strong> use your personal information to train AI models</li>
            <li>Customer data is <strong className="text-brand-text">not</strong> permanently stored in AI systems</li>
            <li>Payment information is processed through Stripe and never exposed to AI tools</li>
            <li>Booking and rental data used by AI tools is processed in memory only and not retained</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-brand-text">Third-Party AI Services</h2>
          <p className="mt-3">
            We may use the following third-party AI services in our operations:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Anthropic (Claude) — operational assistance and content drafting</li>
            <li>Google Workspace AI features — email and document assistance</li>
          </ul>
          <p className="mt-3">
            Each third-party service has its own privacy policy and data handling practices.
            We select partners that maintain strong data protection standards.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-brand-text">Your Rights</h2>
          <p className="mt-3">You have the right to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Ask whether AI was used in any specific interaction or content</li>
            <li>Request that your data not be processed by AI tools (where feasible)</li>
            <li>Contact us with questions about our AI practices</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-brand-text">Contact</h2>
          <p className="mt-3">
            Questions about our AI practices? Contact us at{' '}
            <a href="mailto:info@impactstudio931.com" className="text-brand-accent">info@impactstudio931.com</a> or{' '}
            <a href="tel:6152498096" className="text-brand-accent">615-249-8096</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
