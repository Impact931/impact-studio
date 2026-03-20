'use client';

import { useState, useEffect } from 'react';
import { ContentProvider } from '@/context/inline-editor/ContentContext';
import { ContentSectionById, ContentSectionsExcept } from '@/components/inline-editor/ContentSections';
import EditModeToggle from '@/components/inline-editor/EditModeToggle';
import EquipmentCatalog from '@/components/equipment/EquipmentCatalog';
import {
  STUDIO_RENTALS,
  LIGHTING_BUNDLES,
  ALACARTE_EQUIPMENT,
} from '@/content/equipment-catalog';
import { equipmentRentalDefaults } from '@/content/page-defaults/equipment-rental';
import type { PageContent } from '@/types/inline-editor';

export default function EquipmentRentalClient({
  serverContent,
}: {
  serverContent?: PageContent | null;
}) {
  const [initialContent, setInitialContent] = useState<PageContent>(
    serverContent && serverContent.sections.length > 0
      ? serverContent
      : equipmentRentalDefaults,
  );
  const [ready, setReady] = useState(!!serverContent);

  useEffect(() => {
    if (serverContent) return;
    fetch('/api/admin/content/sections?slug=equipment-rental')
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
    <ContentProvider slug="equipment-rental" initialContent={initialContent}>
      {/* Editable hero */}
      <ContentSectionById id="equip-hero" />

      {/* Static interactive equipment catalog */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <EquipmentCatalog
          studioRentals={STUDIO_RENTALS}
          bundles={LIGHTING_BUNDLES}
          alacarte={ALACARTE_EQUIPMENT}
        />
      </section>

      {/* Remaining editable sections (CTA, policies) */}
      <ContentSectionsExcept exclude={['equip-hero']} />
      <EditModeToggle />
    </ContentProvider>
  );
}
