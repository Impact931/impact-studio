'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

const PAGES = [
  { slug: 'home', title: 'Homepage', path: '/' },
  { slug: 'about', title: 'About', path: '/about' },
  { slug: 'studio-rental', title: 'Studio Rental', path: '/studio-rental' },
  { slug: 'equipment-rental', title: 'Equipment Rental', path: '/equipment-rental' },
  { slug: 'policies', title: 'Policies', path: '/policies' },
  { slug: 'privacy', title: 'Privacy Policy', path: '/privacy' },
  { slug: 'ai-policy', title: 'AI Policy', path: '/ai-policy' },
];

export default function AdminDashboard() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/images/logo-dark.png" alt="Impact Studio" width={120} height={34} className="h-8 w-auto" />
            <span className="text-sm font-medium text-brand-muted">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-brand-muted">{session?.user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="text-sm text-red-500 hover:text-red-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-brand-text mb-2">Content Management</h1>
        <p className="text-brand-muted mb-8">
          Edit page content inline. Click a page to open the editor, or visit the page and press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-mono">⌘⇧E</kbd> to toggle edit mode.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {PAGES.map((page) => (
            <Link
              key={page.slug}
              href={`/admin/pages/${page.slug}`}
              className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 hover:border-brand-accent/50 hover:shadow-sm transition-all group"
            >
              <div>
                <h3 className="font-semibold text-brand-text group-hover:text-brand-accent transition-colors">
                  {page.title}
                </h3>
                <p className="text-sm text-brand-muted">{page.path}</p>
              </div>
              <span className="text-brand-muted group-hover:text-brand-accent transition-colors">→</span>
            </Link>
          ))}
        </div>

        <div className="mt-12 p-6 bg-white rounded-xl border border-gray-200">
          <h2 className="font-semibold text-brand-text mb-3">Quick Actions</h2>
          <div className="flex gap-3">
            <Link
              href="/"
              target="_blank"
              className="px-4 py-2 text-sm bg-brand-light text-brand-text rounded-lg hover:bg-gray-200 transition-colors"
            >
              View Live Site →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
