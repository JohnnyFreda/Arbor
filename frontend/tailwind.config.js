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
        // The neutral scale, biased toward the brand hue rather than left on
        // Tailwind's stock grey -- which is blue-leaning, and made the app read
        // as a white product with green buttons rather than a green one.
        //
        // Overriding `gray` rather than adding a new name is deliberate: every
        // existing gray-* class in the app re-tints from this block alone, with
        // no component churn and nothing left half-migrated.
        //
        // Same lightness steps as Tailwind's grey, hue rotated to moss (143deg),
        // saturation ramping up at the dark end where a neutral can carry more
        // hue before it stops reading as neutral.
        //
        // 500 is darker than a straight interpolation gives. Rotating toward
        // green raises luminance, so the naive value scored 4.23 on white --
        // under AA, and 500 is the muted-text shade. As shipped it measures
        // 4.72 on white and 4.55 on gray-50.
        //
        // 400 keeps Tailwind's luminance instead of following the same rule:
        // its load-bearing job is muted text in dark mode (7.06 on gray-900),
        // and darkening it for light mode broke that.
        gray: {
           50: '#f9fbfa',
          100: '#f3f6f4',
          200: '#e5ebe7',
          300: '#d1dbd5',
          400: '#9daea4',
          500: '#64786c',
          600: '#4e6055',
          700: '#3c4c42',
          800: '#243229',
          900: '#16221b',
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

