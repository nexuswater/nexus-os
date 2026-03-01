import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nexus: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#25D695',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        water: {
          50: '#effaff',
          100: '#def4ff',
          200: '#b6ecff',
          300: '#75dfff',
          400: '#2ccfff',
          500: '#00b8f0',
          600: '#0094cd',
          700: '#0076a6',
          800: '#006389',
          900: '#065271',
          950: '#04344b',
        },
        energy: {
          50: '#fffbeb',
          100: '#fff3c6',
          200: '#ffe588',
          300: '#ffd24a',
          400: '#ffbf20',
          500: '#f99d07',
          600: '#dd7602',
          700: '#b75306',
          800: '#943f0c',
          900: '#7a340d',
          950: '#461a02',
        },
        terminal: {
          DEFAULT: '#0B0F14',
          card: '#111820',
          hover: '#161E2A',
          input: '#0D1117',
          border: '#1C2432',
        },
      },
      fontFamily: {
        sans: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderColor: {
        DEFAULT: '#1C2432',
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 12px rgba(37,214,149,0.06)' },
          '50%': { boxShadow: '0 0 24px rgba(37,214,149,0.12)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
