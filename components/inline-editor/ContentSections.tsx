'use client';

import { useContent } from '@/context/inline-editor/ContentContext';
import { useEditMode } from '@/context/inline-editor/EditModeContext';
import SectionRenderer from './SectionRenderer';
import SectionWrapper from './SectionWrapper';
import type { PageSection } from '@/types/inline-editor';

/**
 * Render a single section by ID from the current content.
 */
export function ContentSectionById({ id }: { id: string }) {
  const { content } = useContent();
  const sorted = [...content.sections].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  return (
    <SectionWrapper sectionId={id} index={idx} totalSections={sorted.length}>
      <SectionRenderer section={sorted[idx]} />
    </SectionWrapper>
  );
}

/**
 * Render all sections EXCEPT the given IDs.
 */
export function ContentSectionsExcept({ exclude }: { exclude: string[] }) {
  const { content } = useContent();
  const { isEditMode } = useEditMode();
  const sorted = [...content.sections]
    .sort((a, b) => a.order - b.order)
    .filter((s) => !exclude.includes(s.id));

  if (sorted.length === 0 && !isEditMode) return null;

  return (
    <>
      {sorted.map((section, index) => (
        <SectionWrapper
          key={section.id}
          sectionId={section.id}
          index={index}
          totalSections={sorted.length}
        >
          <SectionRenderer section={section} />
        </SectionWrapper>
      ))}
    </>
  );
}

/**
 * Render ALL sections from content (without EditablePage empty state).
 */
export default function ContentSections() {
  const { content } = useContent();
  const sorted = [...content.sections].sort((a, b) => a.order - b.order);

  return (
    <>
      {sorted.map((section, index) => (
        <SectionWrapper
          key={section.id}
          sectionId={section.id}
          index={index}
          totalSections={sorted.length}
        >
          <SectionRenderer section={section} />
        </SectionWrapper>
      ))}
    </>
  );
}
