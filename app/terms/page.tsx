import { RENTAL_AGREEMENT } from '@/content/rental-agreement';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Impact Studio',
  description: 'Impact Studio terms of service and equipment rental agreement.',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/"
        className="text-sm text-brand-accent hover:text-brand-accent-hover transition-colors mb-8 inline-block"
      >
        &larr; Back to Home
      </Link>

      <h1 className="text-3xl font-display font-bold text-brand-text mb-8">
        Equipment Rental Agreement
      </h1>

      <div className="prose max-w-none">
        {RENTAL_AGREEMENT.split('\n\n').map((section, idx) => {
          const numberedHeadingMatch = section.match(
            /^(\d+)\.\s+([A-Z][A-Z &]+)$/m,
          );
          if (numberedHeadingMatch) {
            return (
              <h2
                key={idx}
                className="text-lg font-semibold text-brand-text mt-8 mb-3"
              >
                {section}
              </h2>
            );
          }

          if (idx === 0) {
            return (
              <h2
                key={idx}
                className="text-xl font-semibold text-brand-accent mb-4"
              >
                {section}
              </h2>
            );
          }

          return (
            <p
              key={idx}
              className="text-sm text-brand-muted leading-relaxed mb-4 whitespace-pre-wrap"
            >
              {section}
            </p>
          );
        })}
      </div>
    </div>
  );
}
