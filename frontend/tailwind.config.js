/** @type {import('tailwindcss').Config} */

// Surkh brand tokens live here in ONE place.
// Both index.html (preview) and app/page.jsx (real Next.js page)
// use these same class names (bg-primary, font-heading, etc.)
// so the two stay visually in sync.
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#D8323A',    // red — CTAs, brand mark, highlighted words
        secondary: '#F0B856',  // gold — secondary CTA, accent swoosh
        accent: '#111415',     // near-black — hamburger icon, fine details
        textcol: '#1C0204',    // body text on light backgrounds
        background: '#FFFCF7', // warm off-white page background
        herobg: '#242B34',     // dark navy behind the hero map art
      },
      fontFamily: {
        heading: ['var(--font-montserrat)', 'sans-serif'],
        body: ['var(--font-outfit)', 'sans-serif'],
      },
      borderRadius: {
        // Design uses SHARP corners everywhere. Keep these at 0
        // so nobody accidentally reaches for `rounded-lg` etc.
        DEFAULT: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        full: '0px',
      },
    },
  },
  plugins: [],
};
