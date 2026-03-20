import type { PageContent } from '@/types/inline-editor';

export const studioRentalDefaults: PageContent = {
  sections: [
    {
      id: 'studio-hero',
      type: 'hero',
      order: 0,
      data: {
        title: 'Studio Rental',
        description:
          'Professional studio space with cyclorama wall, seamless backgrounds, and everything you need. Hourly, half-day, and full-day packages.',
      },
    },
    {
      id: 'studio-packages',
      type: 'feature-grid',
      order: 1,
      data: {
        title: 'Studio Packages',
        columns: 3,
        cards: [
          {
            title: 'Hourly — $75/hr',
            description:
              'Perfect for quick headshot sessions and product photography. Includes studio access, Wi-Fi & power, grip equipment.',
          },
          {
            title: 'Half Day — $260 (4 hours)',
            description:
              'Ideal for portrait sessions, small team headshots, and content creation. Includes setup & teardown time, Wi-Fi & power, grip equipment.',
            icon: '★',
          },
          {
            title: 'Full Day — $480 (8 hours)',
            description:
              'Best value for larger productions, video shoots, and multi-set days. Full flexibility with multiple set changes, Wi-Fi & power, grip equipment.',
          },
        ],
      },
    },
    {
      id: 'studio-included',
      type: 'feature-grid',
      order: 2,
      data: {
        title: "What's Included",
        columns: 2,
        cards: [
          { title: 'Cyclorama infinity wall', description: '' },
          { title: 'Multi-roll seamless backgrounds', description: '' },
          { title: 'High ceilings for overhead lighting', description: '' },
          { title: 'Climate-controlled environment', description: '' },
          { title: 'Studio Wi-Fi', description: '' },
          { title: 'Grip equipment & sandbags', description: '' },
          { title: 'Extension cables & power strips', description: '' },
          { title: 'Flexible open floor plan', description: '' },
        ],
      },
    },
    {
      id: 'studio-addon',
      type: 'text-block',
      order: 3,
      data: {
        title: 'Add Lighting & Equipment',
        content:
          '<p>Enhance your studio session with professional lighting bundles and à la carte gear. Equipment is priced at discounted in-studio rates when booked with studio time.</p><p><a href="/equipment-rental">Browse Equipment Catalog →</a></p>',
      },
    },
    {
      id: 'studio-cta',
      type: 'cta',
      order: 4,
      data: {
        title: 'Book Your Session',
        description: 'Reserve your studio time and start creating.',
        primaryCta: { text: 'Book Now', href: '/book' },
        variant: 'dark',
      },
    },
  ],
};
