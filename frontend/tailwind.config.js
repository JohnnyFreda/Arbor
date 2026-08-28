/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Arbor's brand green. Defined once here; components reference it by
        // shade rather than hardcoding hexes, so changing the brand is a
        // change to this block and nothing else.
        //
        // 500 is deliberately darker than a naive interpolation would give:
        // white text on it needs to clear WCAG AA (4.5), and the dark-mode
        // button fill uses this shade. It measures 4.54.
        moss: {
           50: '#f2f7f3',
          100: '#e3ece6',
          200: '#c7d9cd',
          300: '#a3c0ac',
          400: '#7fa88c',
          500: '#528063',
          600: '#4d7c5f',
          700: '#3d634c',
          800: '#33503f',
          900: '#2b4235',
        },
        accent: {
          DEFAULT: '#4d7c5f',
          hover: '#3d634c',
        },
      },
    },
  },
  plugins: [],
}

