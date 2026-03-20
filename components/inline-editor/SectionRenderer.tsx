'use client';

import type { PageSection } from '@/types/inline-editor';
import EditableText from './EditableText';
import { useEditMode } from '@/context/inline-editor/EditModeContext';

interface SectionRendererProps {
  section: PageSection;
}

function HeroSectionView({ section }: { section: PageSection & { type: 'hero' } }) {
  return (
    <section className="bg-brand-dark text-white py-20 px-6 text-center">
      <div className="max-w-4xl mx-auto">
        <EditableText sectionId={section.id} field="title" as="h1" className="text-4xl md:text-5xl font-bold mb-4" />
        {section.data.subtitle && (
          <EditableText sectionId={section.id} field="subtitle" as="p" className="text-xl text-gray-300 mb-6" />
        )}
        {section.data.description && (
          <EditableText sectionId={section.id} field="description" as="p" className="text-gray-400 max-w-2xl mx-auto" multiline />
        )}
      </div>
    </section>
  );
}

function TextBlockView({ section }: { section: PageSection & { type: 'text-block' } }) {
  return (
    <section className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        {section.data.title && (
          <EditableText sectionId={section.id} field="title" as="h2" className="text-3xl font-bold text-brand-text mb-6" />
        )}
        <EditableText sectionId={section.id} field="content" className="prose prose-lg max-w-none" multiline />
      </div>
    </section>
  );
}

function FeatureGridView({ section }: { section: PageSection & { type: 'feature-grid' } }) {
  const cols = section.data.columns || 3;
  const gridClass = cols === 2 ? 'md:grid-cols-2' : cols === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3';
  return (
    <section className="py-16 px-6 bg-brand-light">
      <div className="max-w-6xl mx-auto">
        {section.data.title && (
          <EditableText sectionId={section.id} field="title" as="h2" className="text-3xl font-bold text-brand-text text-center mb-4" />
        )}
        {section.data.subtitle && (
          <EditableText sectionId={section.id} field="subtitle" as="p" className="text-brand-muted text-center mb-12 max-w-2xl mx-auto" />
        )}
        <div className={`grid gap-8 ${gridClass}`}>
          {section.data.cards.map((card, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
              {card.icon && <div className="text-3xl mb-3">{card.icon}</div>}
              <EditableText
                sectionId={section.id}
                field={`cards.${i}.title`}
                as="h3"
                className="text-lg font-semibold text-brand-text mb-2"
              />
              <EditableText
                sectionId={section.id}
                field={`cards.${i}.description`}
                as="p"
                className="text-brand-muted text-sm"
                multiline
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASectionView({ section }: { section: PageSection & { type: 'cta' } }) {
  const isDark = section.data.variant !== 'light';
  return (
    <section className={`py-16 px-6 ${isDark ? 'bg-brand-dark text-white' : 'bg-brand-light'}`}>
      <div className="max-w-3xl mx-auto text-center">
        <EditableText
          sectionId={section.id}
          field="title"
          as="h2"
          className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-brand-text'}`}
        />
        {section.data.description && (
          <EditableText
            sectionId={section.id}
            field="description"
            as="p"
            className={`mb-8 ${isDark ? 'text-gray-300' : 'text-brand-muted'}`}
          />
        )}
        <div className="flex gap-4 justify-center">
          {section.data.primaryCta && (
            <a href={section.data.primaryCta.href} className="px-6 py-3 bg-brand-accent text-white rounded-lg font-medium hover:bg-brand-accent/90 transition-colors">
              {section.data.primaryCta.text}
            </a>
          )}
          {section.data.secondaryCta && (
            <a href={section.data.secondaryCta.href} className={`px-6 py-3 border rounded-lg font-medium transition-colors ${isDark ? 'border-white/30 text-white hover:bg-white/10' : 'border-brand-border text-brand-text hover:bg-gray-50'}`}>
              {section.data.secondaryCta.text}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function TestimonialsView({ section }: { section: PageSection & { type: 'testimonials' } }) {
  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        {section.data.title && (
          <EditableText sectionId={section.id} field="title" as="h2" className="text-3xl font-bold text-brand-text text-center mb-12" />
        )}
        <div className="grid md:grid-cols-2 gap-8">
          {section.data.items.map((item, i) => (
            <div key={i} className="bg-brand-light rounded-xl p-6">
              <EditableText
                sectionId={section.id}
                field={`items.${i}.quote`}
                as="p"
                className="text-brand-text italic mb-4"
                multiline
              />
              <div>
                <EditableText
                  sectionId={section.id}
                  field={`items.${i}.author`}
                  as="p"
                  className="font-semibold text-brand-text"
                />
                {item.role && (
                  <EditableText
                    sectionId={section.id}
                    field={`items.${i}.role`}
                    as="p"
                    className="text-sm text-brand-muted"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQView({ section }: { section: PageSection & { type: 'faq' } }) {
  const { isEditMode } = useEditMode();
  return (
    <section className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        {section.data.title && (
          <EditableText sectionId={section.id} field="title" as="h2" className="text-3xl font-bold text-brand-text text-center mb-12" />
        )}
        <div className="space-y-4">
          {section.data.items.map((item, i) => (
            <div key={i} className="border border-brand-border rounded-lg">
              {isEditMode ? (
                <>
                  <div className="px-6 py-4">
                    <EditableText
                      sectionId={section.id}
                      field={`items.${i}.question`}
                      as="div"
                      className="font-medium text-brand-text"
                    />
                  </div>
                  <div className="px-6 pb-4">
                    <EditableText
                      sectionId={section.id}
                      field={`items.${i}.answer`}
                      as="div"
                      className="text-brand-muted"
                      multiline
                    />
                  </div>
                </>
              ) : (
                <details>
                  <summary className="px-6 py-4 cursor-pointer font-medium text-brand-text hover:bg-gray-50">
                    {item.question}
                  </summary>
                  <div className="px-6 pb-4 text-brand-muted">{item.answer}</div>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsView({ section }: { section: PageSection & { type: 'stats' } }) {
  return (
    <section className="py-16 px-6 bg-brand-light">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {section.data.items.map((item, i) => (
          <div key={i}>
            <EditableText
              sectionId={section.id}
              field={`items.${i}.value`}
              as="div"
              className="text-3xl font-bold text-brand-accent mb-1"
            />
            <EditableText
              sectionId={section.id}
              field={`items.${i}.label`}
              as="div"
              className="text-sm text-brand-muted"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function ColumnsView({ section }: { section: PageSection & { type: 'columns' } }) {
  return (
    <section className="py-16 px-6">
      <div className={`max-w-6xl mx-auto grid gap-8 md:grid-cols-${section.data.columns.length}`}>
        {section.data.columns.map((col, i) => (
          <EditableText
            key={i}
            sectionId={section.id}
            field={`columns.${i}.content`}
            className="prose prose-sm max-w-none"
            multiline
          />
        ))}
      </div>
    </section>
  );
}

function ImageGalleryView({ section }: { section: PageSection & { type: 'image-gallery' } }) {
  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {section.data.title && (
          <EditableText sectionId={section.id} field="title" as="h2" className="text-3xl font-bold text-brand-text text-center mb-12" />
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {section.data.images.map((img, i) => (
            <figure key={i}>
              <img src={img.src} alt={img.alt} className="w-full h-64 object-cover rounded-lg" />
              {img.caption && <figcaption className="text-sm text-brand-muted mt-2 text-center">{img.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function SectionRenderer({ section }: SectionRendererProps) {
  switch (section.type) {
    case 'hero':
      return <HeroSectionView section={section} />;
    case 'text-block':
      return <TextBlockView section={section} />;
    case 'feature-grid':
      return <FeatureGridView section={section} />;
    case 'cta':
      return <CTASectionView section={section} />;
    case 'testimonials':
      return <TestimonialsView section={section} />;
    case 'faq':
      return <FAQView section={section} />;
    case 'stats':
      return <StatsView section={section} />;
    case 'columns':
      return <ColumnsView section={section} />;
    case 'image-gallery':
      return <ImageGalleryView section={section} />;
    default:
      return null;
  }
}
