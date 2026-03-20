'use client';

import { useState, useEffect } from 'react';
import PageEditorShell from '@/components/inline-editor/PageEditorShell';
import EquipmentCatalog from '@/components/equipment/EquipmentCatalog';
import {
  STUDIO_RENTALS,
  LIGHTING_BUNDLES,
  ALACARTE_EQUIPMENT,
} from '@/content/equipment-catalog';
import { homeDefaults } from '@/content/page-defaults/home';
import type { PageContent } from '@/types/inline-editor';

export default function HomeClient({
  serverContent,
}: {
  serverContent?: PageContent | null;
}) {
  const [initialContent, setInitialContent] = useState<PageContent>(
    serverContent && serverContent.sections.length > 0
      ? serverContent
      : homeDefaults,
  );
  const [ready, setReady] = useState(!!serverContent);

  useEffect(() => {
    if (serverContent) return; // Already have server data
    fetch('/api/admin/content/sections?slug=home')
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
    <PageEditorShell slug="home" initialContent={initialContent}>
      {/* Equipment catalog — static interactive component below editable sections */}
      <section id="equipment" className="bg-brand-light">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-center font-display text-3xl font-bold text-brand-text sm:text-4xl">
            Equipment &amp; Pricing
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-brand-muted">
            Everything you need for your next shoot, available in-studio or to
            take on location.
          </p>
          <div className="mt-12">
            <EquipmentCatalog
              studioRentals={STUDIO_RENTALS}
              bundles={LIGHTING_BUNDLES}
              alacarte={ALACARTE_EQUIPMENT}
            />
          </div>
        </div>
      </section>
    </PageEditorShell>
  );
}
