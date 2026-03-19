'use client';

import { useContent } from '@/context/inline-editor/ContentContext';
import SectionRenderer from './SectionRenderer';
import SectionWrapper from './SectionWrapper';
import { useEditMode } from '@/context/inline-editor/EditModeContext';

export default function EditablePage() {
  const { content } = useContent();
  const { isEditMode } = useEditMode();

  const sortedSections = [...content.sections].sort((a, b) => a.order - b.order);

  return (
    <div className={isEditMode ? 'ml-14' : ''}>
      {sortedSections.map((section, index) => (
        <SectionWrapper
          key={section.id}
          sectionId={section.id}
          index={index}
          totalSections={sortedSections.length}
        >
          <SectionRenderer section={section} />
        </SectionWrapper>
      ))}
    </div>
  );
}
