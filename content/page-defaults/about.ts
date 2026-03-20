import type { PageContent } from '@/types/inline-editor';

export const aboutDefaults: PageContent = {
  sections: [
    {
      id: 'about-hero',
      type: 'hero',
      order: 0,
      data: {
        title: 'About Impact Studio',
        description:
          'A creative space built for photographers, videographers, and content creators.',
      },
    },
    {
      id: 'about-story',
      type: 'text-block',
      order: 1,
      data: {
        title: 'Our Story',
        content:
          '<p>Impact Studio was born from a simple idea: every creator deserves access to professional-grade equipment and studio space without the overhead of owning it all.</p><p>Founded by JHR Photography LLC — a Nashville-based event, tradeshow, and headshot media agency — Impact Studio brings the same level of professionalism and reliability that JHR delivers to Fortune 500 clients, but in a space designed for the broader creative community.</p><p>Located in Clarksville, Tennessee, our studio features a cyclorama wall, multiple seamless background options, professional Flashpoint lighting systems, and everything you need to walk in and start creating. Whether you\'re shooting corporate headshots, fashion editorials, product photography, or video content — we have you covered.</p><p>Our mission is simple: <strong>remove uncertainty</strong>. When you rent from Impact Studio, you get professional equipment that works, a clean and well-maintained space, and a team that understands what creators need.</p>',
      },
    },
    {
      id: 'about-space',
      type: 'feature-grid',
      order: 2,
      data: {
        title: 'The Space',
        columns: 3,
        cards: [
          {
            title: 'Cyclorama Wall',
            description:
              'Seamless curved infinity wall for clean backgrounds — perfect for headshots, portraits, and product photography.',
          },
          {
            title: 'Multi-Roll Backgrounds',
            description:
              "Multiple seamless paper rolls in various colors, ready to drop at a moment's notice.",
          },
          {
            title: 'Professional Lighting',
            description:
              'Flashpoint 400 and 600 series strobes with a full range of modifiers — softboxes, strip lights, and beauty dishes.',
          },
          {
            title: 'Tethering Station',
            description:
              'Dedicated laptop stand with tether cables for real-time image review during your shoot.',
          },
          {
            title: 'High Ceilings',
            description:
              'Generous vertical space accommodates full-length portraits, overhead lighting rigs, and creative setups.',
          },
          {
            title: 'Climate Controlled',
            description:
              'Comfortable year-round temperature with studio Wi-Fi, power, and grip equipment included.',
          },
        ],
      },
    },
    {
      id: 'about-stats',
      type: 'stats',
      order: 3,
      data: {
        items: [
          { value: '1,200 sq ft', label: 'Studio Space' },
          { value: '30+', label: 'Equipment Items' },
          { value: '7AM–11PM', label: 'Open Hours' },
          { value: '7', label: 'Days Per Week' },
        ],
      },
    },
    {
      id: 'about-cta',
      type: 'cta',
      order: 4,
      data: {
        title: 'Ready to See the Space?',
        description: 'Book a studio session or rent equipment today.',
        primaryCta: { text: 'Book Studio', href: '/studio-rental' },
        secondaryCta: { text: 'Rent Equipment', href: '/equipment-rental' },
        variant: 'dark',
      },
    },
  ],
};
