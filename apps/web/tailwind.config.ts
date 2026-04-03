import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0f172a',
        muted: '#94a3b8',
        primary: '#2563eb',
      },
    },
  },
  plugins: [],
};

export default config;
