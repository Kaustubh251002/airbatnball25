/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./styles/**/*.css"
  ],
  theme: {
    extend: {
      colors: {
        // CSS-variable driven — supports dark/light themes
        app:     'rgb(var(--c-app) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        raised:  'rgb(var(--c-raised) / <alpha-value>)',
        stroke:  'rgb(var(--c-stroke) / <alpha-value>)',
        // Fixed accent colors
        brand:   '#FF6B35',
        gold:    '#F5C542',
        silver:  '#9EB2C8',
        bronze:  '#C87941',
        leaf:    '#22C55E',
      },
      keyframes: {
        slideInRow: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        flashNew: {
          '0%':   { backgroundColor: 'rgba(255, 107, 53, 0.13)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
      animation: {
        slideInRow: 'slideInRow 0.3s ease both',
        flashNew:   'flashNew 2.5s ease-out forwards',
      },
    }
  },
  plugins: []
};
