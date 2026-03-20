'use client';

import { useContent } from '@/context/inline-editor/ContentContext';
import SectionRenderer from './SectionRenderer';
import SectionWrapper from './SectionWrapper';
import { useEditMode } from '@/context/inline-editor/EditModeContext';
import type { InlineSectionType, PageSection } from '@/types/inline-editor';
import { v4 as uuidv4 } from 'uuid';

const SECTION_TYPES: { value: InlineSectionType; label: string }[] = [
  { value: 'hero', label: 'Hero' },
  { value: 'text-block', label: 'Text Block' },
  { value: 'feature-grid', label: 'Feature Grid' },
  { value: 'cta', label: 'Call to Action' },
  { value: 'testimonials', label: 'Testimonials' },
  { value: 'faq', label: 'FAQ' },
  { value: 'stats', label: 'Stats' },
  { value: 'columns', label: 'Columns' },
  { value: 'image-gallery', label: 'Image Gallery' },
];

function getDefaultData(type: InlineSectionType): Record<string, unknown> {
  switch (type) {
    case 'hero':
      return { title: 'New Hero Section', subtitle: '', description: '' };
    case 'text-block':
      return { title: 'New Section', content: '<p>Add your content here.</p>' };
    case 'feature-grid':
      return { title: 'Features', cards: [{ title: 'Feature 1', description: 'Description', icon: '✨' }] };
    case 'cta':
      return { title: 'Ready to Get Started?', description: '', primaryCta: { text: 'Get Started', href: '/book' } };
    case 'testimonials':
      return { title: 'What People Say', items: [{ quote: 'Great service!', author: 'Client' }] };
    case 'faq':
      return { title: 'FAQ', items: [{ question: 'Question?', answer: 'Answer.' }] };
    case 'stats':
      return { items: [{ value: '100+', label: 'Stat Label' }] };
    case 'columns':
      return { columns: [{ content: '<p>Column 1</p>' }, { content: '<p>Column 2</p>' }] };
    case 'image-gallery':
      return { title: 'Gallery', images: [] };
    default:
      return {};
  }
}

function EmptyState({ onAdd }: { onAdd: (section: PageSection) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-brand-accent/10 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-brand-accent" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">No sections yet</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-md">
        This page has no content sections. Click a section type below to add your first section, or use the pencil button to enter edit mode.
      </p>
      <div className="flex flex-wrap gap-2 justify-center max-w-lg">
        {SECTION_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              onAdd({
                id: uuidv4(),
                type: t.value,
                order: 0,
                data: getDefaultData(t.value),
              } as PageSection);
            }}
            className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:border-brand-accent hover:text-brand-accent transition-colors"
          >
            + {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function EditablePage() {
  const { content, addSection } = useContent();
  const { isEditMode } = useEditMode();

  const sortedSections = [...content.sections].sort((a, b) => a.order - b.order);

  if (sortedSections.length === 0) {
    if (isEditMode) {
      return <EmptyState onAdd={(section) => addSection(section)} />;
    }
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <p>No content yet. Click the pencil icon to start editing.</p>
      </div>
    );
  }

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
