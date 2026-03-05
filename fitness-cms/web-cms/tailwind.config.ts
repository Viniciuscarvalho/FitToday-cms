import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: '#3B82F6',
          secondary: '#60A5FA',
          accent: '#FB7185',
          background: '#111111',
          backgroundElevated: '#1A1A1A',
          surface: '#1E1E1E',
          surfaceElevated: '#252525',
          textSecondary: '#94A3B8',
          textTertiary: '#64748B',
          outline: '#2A2A2A',
          outlineVariant: '#3A3A3A',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        accent: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
        },
      },
    },
  },
  plugins: [],
};

export default config;
