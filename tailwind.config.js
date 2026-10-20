/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.html",
    "./*.html",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          maroon: '#5C1520',      // Oxblood maroon (primary brand)
          maroonDark: '#33090F',  // Maroon deep (dark sections)
          ember: '#C4181F',       // Ember red (CTAs, accents only)
          gold: '#D9A441',        // Gold (highlights, credentials, eyebrows)
          charcoalDark: '#1D2023',// Steel charcoal dark (primary bg)
          charcoalLight: '#262A2E',// Steel charcoal light (accent bg)
          paper: '#F1E6CE',       // Paper cream (light sections)
          ivory: '#F7F2E6',       // Ivory (body text on dark bg)
        }
      },
      fontFamily: {
        headline: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        nav: ['Oswald', 'sans-serif'],
        numeric: ['Oswald', 'sans-serif'],
        signage: ['"Bebas Neue"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
