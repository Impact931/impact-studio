import type { PageContent } from '@/types/inline-editor';

export const equipmentRentalDefaults: PageContent = {
  sections: [
    {
      id: 'equip-hero',
      type: 'hero',
      order: 0,
      data: {
        title: 'Equipment Rental',
        description:
          'Professional lighting, grip, and camera support equipment. Rent individual items or bundles for in-studio or on-location shoots.',
      },
    },
    {
      id: 'equip-booking-cta',
      type: 'cta',
      order: 1,
      data: {
        title: 'Ready to Rent?',
        description: 'Select your equipment and complete checkout in just a few steps.',
        primaryCta: { text: 'Start Booking', href: '/book' },
        variant: 'light',
      },
    },
    {
      id: 'equip-policies',
      type: 'feature-grid',
      order: 2,
      data: {
        title: 'Good to Know',
        columns: 3,
        cards: [
          {
            title: 'Insurance',
            description:
              'COI required for rentals over $15K replacement value. No COI? Security deposit hold applies.',
          },
          {
            title: 'Returns',
            description:
              'Equipment must be returned clean and in its case. Late returns charged at the full daily rate.',
          },
          {
            title: 'Cancellation',
            description:
              'Full refund (minus $25 fee) with 7+ days notice. See our policies for details.',
          },
        ],
      },
    },
  ],
};
