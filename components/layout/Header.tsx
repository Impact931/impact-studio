'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/studio-rental', label: 'Studio Rental' },
  { href: '/equipment-rental', label: 'Equipment Rental' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { customer, logout, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-brand-border bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo-dark.png"
            alt="Impact Studio"
            width={140}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-brand-text transition-colors hover:text-brand-accent"
            >
              {link.label}
            </Link>
          ))}

          {!loading && (
            <>
              {customer ? (
                <div className="flex items-center gap-4">
                  <span className="text-xs text-brand-muted">
                    {customer.name}
                  </span>
                  <Link
                    href="/book"
                    className="rounded-full bg-brand-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-accent-hover"
                  >
                    Book Now
                  </Link>
                  <button
                    onClick={logout}
                    className="text-xs text-brand-muted transition-colors hover:text-brand-text"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/account/login"
                    className="text-sm font-medium text-brand-muted transition-colors hover:text-brand-text"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/account/create"
                    className="rounded-full bg-brand-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-accent-hover"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-md md:hidden"
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6 text-brand-text"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="border-t border-brand-border bg-white px-6 pb-4 pt-2 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-3 text-sm font-medium text-brand-text transition-colors hover:text-brand-accent"
            >
              {link.label}
            </Link>
          ))}

          <div className="mt-2 border-t border-brand-border pt-3">
            {customer ? (
              <>
                <p className="py-2 text-xs text-brand-muted">
                  Signed in as {customer.name}
                </p>
                <Link
                  href="/book"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-full bg-brand-accent px-5 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-accent-hover"
                >
                  Book Now
                </Link>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="mt-2 block w-full py-2 text-center text-xs text-brand-muted hover:text-brand-text"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/account/login"
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 text-sm font-medium text-brand-muted hover:text-brand-text"
                >
                  Sign In
                </Link>
                <Link
                  href="/account/create"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-full bg-brand-accent px-5 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-accent-hover"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
