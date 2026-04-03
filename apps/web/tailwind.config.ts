import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#111827',
        muted: '#6b7280',
        primary: '#2563eb',
      },
    },
  },
  plugins: [],
};

export default config;
