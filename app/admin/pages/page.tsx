'use client';

import Link from 'next/link';
import { FileText, ExternalLink } from 'lucide-react';

const PAGES = [
  { slug: 'home', title: 'Homepage', path: '/' },
  { slug: 'about', title: 'About', path: '/about' },
  { slug: 'studio-rental', title: 'Studio Rental', path: '/studio-rental' },
  { slug: 'equipment-rental', title: 'Equipment Rental', path: '/equipment-rental' },
  { slug: 'policies', title: 'Policies', path: '/policies' },
  { slug: 'privacy', title: 'Privacy Policy', path: '/privacy' },
  { slug: 'ai-policy', title: 'AI Policy', path: '/ai-policy' },
];

export default function PagesListPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
        <p className="text-gray-500 mt-1">
          Edit page content inline. Click a page to open the editor.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {PAGES.map((page) => (
            <Link
              key={page.slug}
              href={`/admin/pages/${page.slug}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400 group-hover:text-brand-accent transition-colors" />
                <div>
                  <h3 className="font-medium text-gray-900 group-hover:text-brand-accent transition-colors">
                    {page.title}
                  </h3>
                  <p className="text-sm text-gray-500">{page.path}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={page.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-md text-gray-400 hover:text-brand-accent hover:bg-brand-accent/5 transition-colors"
                  title="View live page"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <span className="text-gray-400 group-hover:text-brand-accent transition-colors">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
