'use client';

import { useState, useEffect } from 'react';
import PageEditorShell from '@/components/inline-editor/PageEditorShell';
import { studioRentalDefaults } from '@/content/page-defaults/studio-rental';
import type { PageContent } from '@/types/inline-editor';

export default function StudioRentalClient({
  serverContent,
}: {
  serverContent?: PageContent | null;
}) {
  const [initialContent, setInitialContent] = useState<PageContent>(
    serverContent && serverContent.sections.length > 0
      ? serverContent
      : studioRentalDefaults,
  );
  const [ready, setReady] = useState(!!serverContent);

  useEffect(() => {
    if (serverContent) return;
    fetch('/api/admin/content/sections?slug=studio-rental')
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

  return (
    <PageEditorShell slug="studio-rental" initialContent={initialContent} />
  );
}
