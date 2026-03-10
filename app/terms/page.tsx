import { RENTAL_AGREEMENT } from '@/content/rental-agreement';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-brand-black text-brand-text">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="text-sm text-brand-accent hover:text-brand-accent-hover transition-colors mb-8 inline-block"
        >
          &larr; Back to Home
        </Link>

        <h1 className="text-3xl font-display font-bold text-brand-white mb-8">
          Equipment Rental Agreement
        </h1>

        <div className="prose prose-invert max-w-none">
          {RENTAL_AGREEMENT.split('\n\n').map((section, idx) => {
            // Check if section starts with a number (numbered section heading)
            const numberedHeadingMatch = section.match(
              /^(\d+)\.\s+([A-Z][A-Z &]+)$/m,
            );
            if (numberedHeadingMatch) {
              return (
                <h2
                  key={idx}
                  className="text-lg font-semibold text-brand-white mt-8 mb-3"
                >
                  {section}
                </h2>
              );
            }

            // Check if it's the title
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
    </div>
  );
}
