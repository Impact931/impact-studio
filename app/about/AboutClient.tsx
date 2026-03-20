'use client';

import { useState, useEffect } from 'react';
import PageEditorShell from '@/components/inline-editor/PageEditorShell';
import { aboutDefaults } from '@/content/page-defaults/about';
import type { PageContent } from '@/types/inline-editor';

export default function AboutClient({
  serverContent,
}: {
  serverContent?: PageContent | null;
}) {
  const [initialContent, setInitialContent] = useState<PageContent>(
    serverContent && serverContent.sections.length > 0
      ? serverContent
      : aboutDefaults,
  );
  const [ready, setReady] = useState(!!serverContent);

  useEffect(() => {
    if (serverContent) return;
    fetch('/api/admin/content/sections?slug=about')
      .then((r) => r.json())
      .then((data) => {
        if (data.sections && data.sections.length > 0) {
          setInitialContent({
            sections: data.sections,
            seo: data.seo,
            updatedAt: data.updatedAt,
          });
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [serverContent]);

  if (!ready) return <div className="min-h-screen" />;

  return <PageEditorShell slug="about" initialContent={initialContent} />;
}
