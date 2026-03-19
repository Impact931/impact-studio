export type InlineSectionType =
  | 'hero'
  | 'text-block'
  | 'feature-grid'
  | 'image-gallery'
  | 'cta'
  | 'testimonials'
  | 'faq'
  | 'columns'
  | 'stats';

export interface SectionSEO {
  ariaLabel?: string;
  sectionId?: string;
}

export interface BaseSection {
  id: string;
  type: InlineSectionType;
  order: number;
  seo?: SectionSEO;
}

export interface HeroSection extends BaseSection {
  type: 'hero';
  data: {
    title: string;
    subtitle?: string;
    description?: string;
    image?: string;
    primaryCta?: { text: string; href: string };
    secondaryCta?: { text: string; href: string };
    variant?: 'full-height' | 'half-height' | 'banner';
  };
}

export interface TextBlockSection extends BaseSection {
  type: 'text-block';
  data: {
    title?: string;
    content: string;
  };
}

export interface FeatureGridSection extends BaseSection {
  type: 'feature-grid';
  data: {
    title?: string;
    subtitle?: string;
    columns?: 2 | 3 | 4;
    cards: Array<{
      title: string;
      description: string;
      icon?: string;
    }>;
  };
}

export interface CTASection extends BaseSection {
  type: 'cta';
  data: {
    title: string;
    description?: string;
    primaryCta?: { text: string; href: string };
    secondaryCta?: { text: string; href: string };
    variant?: 'light' | 'dark';
  };
}

export interface ImageGallerySection extends BaseSection {
  type: 'image-gallery';
  data: {
    title?: string;
    images: Array<{ src: string; alt: string; caption?: string }>;
  };
}

export interface TestimonialsSection extends BaseSection {
  type: 'testimonials';
  data: {
    title?: string;
    items: Array<{ quote: string; author: string; role?: string }>;
  };
}

export interface FAQSection extends BaseSection {
  type: 'faq';
  data: {
    title?: string;
    items: Array<{ question: string; answer: string }>;
  };
}

export interface StatsSection extends BaseSection {
  type: 'stats';
  data: {
    items: Array<{ value: string; label: string }>;
  };
}

export interface ColumnsSection extends BaseSection {
  type: 'columns';
  data: {
    columns: Array<{ content: string }>;
  };
}

export type PageSection =
  | HeroSection
  | TextBlockSection
  | FeatureGridSection
  | CTASection
  | ImageGallerySection
  | TestimonialsSection
  | FAQSection
  | StatsSection
  | ColumnsSection;

export interface PageSEO {
  pageTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
}

export interface PageContent {
  sections: PageSection[];
  seo?: PageSEO;
  updatedAt?: string;
}
