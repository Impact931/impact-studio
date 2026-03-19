'use client';

import { useEditMode } from '@/context/inline-editor/EditModeContext';
import { useContent } from '@/context/inline-editor/ContentContext';
import type { InlineSectionType } from '@/types/inline-editor';
import { v4 as uuidv4 } from 'uuid';

interface SectionWrapperProps {
  sectionId: string;
  index: number;
  totalSections: number;
  children: React.ReactNode;
}

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

export default function SectionWrapper({ sectionId, index, totalSections, children }: SectionWrapperProps) {
  const { isEditMode } = useEditMode();
  const { moveSection, removeSection, addSection } = useContent();

  if (!isEditMode) return <>{children}</>;

  const handleAdd = (type: InlineSectionType) => {
    addSection(
      {
        id: uuidv4(),
        type,
        order: index + 1,
        data: getDefaultData(type),
      } as never,
      index,
    );
  };

  return (
    <div className="relative group/section">
      {/* Section controls */}
      <div className="absolute -left-12 top-4 z-40 hidden group-hover/section:flex flex-col gap-1">
        <button
          onClick={() => moveSection(sectionId, 'up')}
          disabled={index === 0}
          className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded shadow-sm text-xs hover:bg-gray-50 disabled:opacity-30"
          title="Move up"
        >
          ↑
        </button>
        <button
          onClick={() => moveSection(sectionId, 'down')}
          disabled={index === totalSections - 1}
          className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded shadow-sm text-xs hover:bg-gray-50 disabled:opacity-30"
          title="Move down"
        >
          ↓
        </button>
        <button
          onClick={() => {
            if (window.confirm('Delete this section?')) {
              removeSection(sectionId);
            }
          }}
          className="w-8 h-8 flex items-center justify-center bg-white border border-red-200 rounded shadow-sm text-xs text-red-500 hover:bg-red-50"
          title="Delete section"
        >
          ✕
        </button>
      </div>

      {/* Section outline */}
      <div className="ring-1 ring-transparent group-hover/section:ring-brand-accent/30 rounded-lg transition-all">
        {children}
      </div>

      {/* Add section below */}
      <div className="relative h-8 flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-opacity">
        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-brand-accent/30" />
        <div className="relative z-10">
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleAdd(e.target.value as InlineSectionType);
                e.target.value = '';
              }
            }}
            defaultValue=""
            className="text-xs bg-white border border-brand-accent/40 text-brand-accent rounded px-2 py-1 cursor-pointer hover:border-brand-accent"
          >
            <option value="" disabled>+ Add Section</option>
            {SECTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
