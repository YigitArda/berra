import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0b1220',
        muted: '#64748b',
        primary: '#2563eb',
      },
    },
  },
  plugins: [],
};

export default config;
