import type { PageContent } from '@/types/inline-editor';

export const homeDefaults: PageContent = {
  sections: [
    {
      id: 'home-hero',
      type: 'hero',
      order: 0,
      data: {
        title: 'Professional Studio & Equipment Rental',
        description:
          "Clarksville's premier photography studio — cyclorama wall, pro lighting, and everything you need to create.",
        primaryCta: { text: 'Studio Rental', href: '/studio-rental' },
        secondaryCta: { text: 'Equipment Rental', href: '/equipment-rental' },
      },
    },
    {
      id: 'home-services',
      type: 'feature-grid',
      order: 1,
      data: {
        title: 'What We Offer',
        columns: 2,
        cards: [
          {
            title: 'Studio Rental',
            description:
              'Book our professional studio space with cyclorama wall, seamless backgrounds, and climate-controlled environment. Hourly, half-day, and full-day packages available. From $75/hr',
          },
          {
            title: 'Equipment Rental',
            description:
              'Professional lighting, grip, camera support, and accessories. Rent individual items or bundles for in-studio or on-location shoots. Starting at $5/day',
          },
        ],
      },
    },
    {
      id: 'home-studio-features',
      type: 'feature-grid',
      order: 2,
      data: {
        title: 'The Studio',
        columns: 3,
        cards: [
          {
            title: 'Cyclorama Wall',
            description: 'Seamless curved infinity wall for clean, professional backgrounds.',
          },
          {
            title: 'Multi-Roll Seamless Backgrounds',
            description: 'Multiple color options ready to drop for any shoot style.',
          },
          {
            title: 'Professional Lighting',
            description: 'Flashpoint strobes, softboxes, and modifiers for every setup.',
          },
          {
            title: 'Tethering Station',
            description: 'Laptop stand and tether cables for real-time image review.',
          },
          {
            title: 'High Ceilings',
            description: 'Generous vertical space for full-length and overhead lighting.',
          },
          {
            title: 'Open Production Floor',
            description: 'Flexible layout for photo, video, or multi-set productions.',
          },
        ],
      },
    },
    {
      id: 'home-how-it-works',
      type: 'feature-grid',
      order: 3,
      data: {
        title: 'How It Works',
        columns: 3,
        cards: [
          {
            title: 'Select',
            description:
              'Browse our equipment catalog and studio packages. Add what you need to your cart.',
            icon: '1',
          },
          {
            title: 'Book',
            description:
              'Choose your rental dates, sign the agreement, and complete checkout securely.',
            icon: '2',
          },
          {
            title: 'Create',
            description:
              'Pick up your gear and create something amazing. We handle the rest.',
            icon: '3',
          },
        ],
      },
    },
    {
      id: 'home-policies',
      type: 'feature-grid',
      order: 4,
      data: {
        title: 'Before You Book',
        columns: 3,
        cards: [
          {
            title: 'Insurance',
            description:
              'A $1M general liability COI naming JHR Photography LLC is required for rentals over $15,000 replacement value. No COI? A security deposit hold is applied instead.',
          },
          {
            title: 'Cancellation',
            description:
              '7+ days: Full refund (minus $25 fee). 48hrs – 7 days: 50% refund. Under 48 hours: No refund.',
          },
          {
            title: "What's Included",
            description:
              'Grip equipment & sandbags, extension cables & power strips, studio Wi-Fi, climate-controlled space.',
          },
        ],
      },
    },
    {
      id: 'home-location',
      type: 'text-block',
      order: 5,
      data: {
        title: 'Visit the Studio',
        content:
          '<p><strong>Location:</strong> 2300 Rotary Park Dr, Suite A, Clarksville, TN 37043</p><p><strong>Hours:</strong> 7:00 AM – 11:00 PM, Seven days a week</p><p><strong>Contact:</strong> <a href="tel:6152498096">615-249-8096</a> · <a href="mailto:info@impactstudio931.com">info@impactstudio931.com</a></p>',
      },
    },
    {
      id: 'home-cta',
      type: 'cta',
      order: 6,
      data: {
        title: 'Ready to Create?',
        description: 'Book your studio time and equipment today.',
        primaryCta: { text: 'Book Studio', href: '/studio-rental' },
        secondaryCta: { text: 'Rent Equipment', href: '/equipment-rental' },
        variant: 'dark',
      },
    },
  ],
};
