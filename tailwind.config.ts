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
          black: '#0a0a0a',
          dark: '#141414',
          card: '#1a1a1a',
          border: '#2a2a2a',
          muted: '#666666',
          text: '#e0e0e0',
          white: '#f5f5f5',
          accent: '#c8a96e',
          'accent-hover': '#d4b97e',
          'accent-dim': '#a08850',
          blue: '#3b82f6',
          green: '#22c55e',
          red: '#ef4444',
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
