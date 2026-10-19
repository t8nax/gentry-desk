import plugin from 'tailwindcss/plugin'
import { dark, fonts, kitColors, kitVars, light } from './src/theme/tokens.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        kit: kitColors,
      },
      fontFamily: {
        sans: fonts.sans,
        mono: fonts.mono,
      },
      keyframes: {
        'pulse-border': {
          '0%': { boxShadow: '0 0 0 0 var(--kit-waiting-glow)' },
          '70%': { boxShadow: '0 0 0 4px transparent' },
          '100%': { boxShadow: '0 0 0 0 transparent' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.25' },
        },
        'fade-in': {
          from: { opacity: '0' },
        },
      },
      animation: {
        'pulse-border': 'pulse-border 2s infinite',
        blink: 'blink 1.4s ease-in-out infinite',
        'side-label-in': 'fade-in 160ms ease both',
        'loaded-in': 'fade-in 180ms ease-out',
        'spin-slow': 'spin 0.9s linear infinite',
      },
    },
  },
  plugins: [
    // Пока оператор не выбрал тему, панель идёт за системой; выбор приходит атрибутом data-theme
    plugin(({ addBase }) => {
      addBase({
        ':root': { ...kitVars(dark), colorScheme: 'dark' },
        '@media (prefers-color-scheme: light)': {
          ':root:not([data-theme="dark"])': { ...kitVars(light), colorScheme: 'light' },
        },
        ':root[data-theme="light"]': { ...kitVars(light), colorScheme: 'light' },
      })
    }),
  ],
}
