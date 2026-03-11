import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-gray-300">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Image
              src="/images/logo-white.png"
              alt="Impact Studio"
              width={140}
              height={40}
              className="h-10 w-auto"
            />
            <p className="mt-3 text-sm text-gray-400">
              Professional studio and equipment rental in Clarksville, TN.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              A JHR Photography LLC studio.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Contact
            </h4>
            <address className="mt-4 space-y-2 text-sm not-italic text-gray-300">
              <p>2300 Rotary Park Dr, Suite A</p>
              <p>Clarksville, TN 37043</p>
              <p className="mt-3">
                <a
                  href="tel:6152498096"
                  className="transition-colors hover:text-brand-accent"
                >
                  615-249-8096
                </a>
              </p>
              <p>
                <a
                  href="mailto:info@impactstudio931.com"
                  className="transition-colors hover:text-brand-accent"
                >
                  info@impactstudio931.com
                </a>
              </p>
            </address>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Studio Hours
            </h4>
            <p className="mt-4 text-sm text-gray-300">
              7:00 AM &ndash; 11:00 PM
            </p>
            <p className="mt-1 text-sm text-gray-400">Seven days a week</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Quick Links
            </h4>
            <nav className="mt-4 flex flex-col gap-2 text-sm">
              <Link href="/studio-rental" className="transition-colors hover:text-brand-accent">
                Studio Rental
              </Link>
              <Link href="/equipment-rental" className="transition-colors hover:text-brand-accent">
                Equipment Rental
              </Link>
              <Link href="/policies" className="transition-colors hover:text-brand-accent">
                Rental Policies
              </Link>
              <Link href="/about" className="transition-colors hover:text-brand-accent">
                About
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-700 pt-8 sm:flex-row">
          <p className="text-xs text-gray-500">
            &copy; 2026 Impact Studio &mdash; JHR Photography LLC. All rights reserved.
          </p>
          <nav className="flex gap-6 text-xs text-gray-500">
            <Link href="/privacy" className="transition-colors hover:text-gray-300">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-gray-300">
              Terms
            </Link>
            <Link href="/ai-policy" className="transition-colors hover:text-gray-300">
              AI Policy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
