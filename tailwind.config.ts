import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          white: '#FFFFFF',
          light: '#F8F8F8',
          card: '#FFFFFF',
          text: '#1A1A1A',
          muted: '#6B7280',
          accent: '#C8A96E',
          'accent-hover': '#B8964E',
          'accent-dim': '#a08850',
          dark: '#1A1A1A',
          border: '#E5E7EB',
          success: '#059669',
          warning: '#D97706',
          red: '#DC2626',
          blue: '#3b82f6',
          green: '#059669',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
