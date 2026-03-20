'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ContentProvider } from '@/context/inline-editor/ContentContext';
import { EditModeProvider } from '@/context/inline-editor/EditModeContext';
import EditablePage from '@/components/inline-editor/EditablePage';
import EditModeToggle from '@/components/inline-editor/EditModeToggle';
import type { PageContent } from '@/types/inline-editor';
import Link from 'next/link';

// Default content for each page slug
import { homeDefaults } from '@/content/page-defaults/home';
import { aboutDefaults } from '@/content/page-defaults/about';
import { studioRentalDefaults } from '@/content/page-defaults/studio-rental';
import { equipmentRentalDefaults } from '@/content/page-defaults/equipment-rental';

const PAGE_DEFAULTS: Record<string, PageContent> = {
  home: homeDefaults,
  about: aboutDefaults,
  'studio-rental': studioRentalDefaults,
  'equipment-rental': equipmentRentalDefaults,
};

const EMPTY_CONTENT: PageContent = {
  sections: [],
  seo: {},
};

function getDefaults(slug: string): PageContent {
  return PAGE_DEFAULTS[slug] || EMPTY_CONTENT;
}

function PageEditorInner({ slug }: { slug: string }) {
  const [content, setContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/content/sections?slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          // If DynamoDB has saved content, use it; otherwise use page defaults
          if (data.sections && data.sections.length > 0) {
            setContent({
              sections: data.sections,
              seo: data.seo || {},
              updatedAt: data.updatedAt,
            });
          } else {
            setContent(getDefaults(slug));
          }
        } else {
          setContent(getDefaults(slug));
        }
      } catch {
        setError('Failed to load content');
        setContent(getDefaults(slug));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-brand-muted">Loading editor...</div>
      </div>
    );
  }

  if (error && !content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <ContentProvider slug={slug} initialContent={content || getDefaults(slug)}>
      <div className="min-h-screen">
        {/* Editor header */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/pages" className="text-sm text-brand-muted hover:text-brand-text">
                ← Pages
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-sm font-medium text-brand-text capitalize">{slug.replace(/-/g, ' ')}</span>
            </div>
            <div className="text-xs text-brand-muted">
              Press <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded font-mono">⌘⇧E</kbd> to toggle edit mode
            </div>
          </div>
        </div>

        {/* Page content */}
        <EditablePage />
        <EditModeToggle />
      </div>
    </ContentProvider>
  );
}

export default function PageEditorPage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <EditModeProvider>
      <PageEditorInner slug={slug} />
    </EditModeProvider>
  );
}
