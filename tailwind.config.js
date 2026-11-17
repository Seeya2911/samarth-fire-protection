/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.html",
    "./src/**/*.md",
    "./build.js",
    "./*.html",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Vibrant Aesthetic Safety Palette (Friendly, Human, Warm)
          red: '#9E2127',         // Vibrant Safety Crimson Red
          redDark: '#851B22',     // Deep Crimson
          redLight: '#F6ECE8',    // Soft Red Tint
          orange: '#B94B3E',      // Cheerful Flame Orange
          orangeLight: '#F6ECE8', // Soft Orange Tint
          amber: '#E8AE36',       // Warm Saffron Gold
          amberLight: '#F1E6D8',  // Soft Amber Tint
          blue: '#9E2127',        // Trust Royal Blue
          blueDark: '#851B22',    // Deep Royal Navy
          blueLight: '#E9D4D0',   // Soft Sky Blue Tint
          emerald: '#10B981',     // Verified Green
          emeraldLight: '#D1FAE5',// Soft Mint Tint
          purple: '#7C3AED',      // Engineering Purple
          purpleLight: '#EDE9FE', // Soft Lavender Tint
          
          // Canvas & Neutral Surfaces
          canvas: '#FAF7F2',      // Pure Clean White
          canvasWarm: '#F6ECE8',  // Warm Stone/Ivory 50
          canvasSlate: '#F1E6D8', // Crisp Slate 50
          borderSubtle: '#E8DAD2',// Slate 200
          textHead: '#554B49',    // Deep Slate 900
          textBody: '#665A55',    // Slate 700
          textMuted: '#817572',   // Slate 500

          // Legacy Mappings for Seamless Compatibility
          ember: '#EA580C',
          emberDark: '#C2410C',
          gold: '#F59E0B',
          cyan: '#0284C7',
          maroon: '#B91C1C',
          maroonDark: '#991B1B',
          charcoalDark: '#554B49',
          charcoalLight: '#817572',
          paper: '#F1E6D8',
          ivory: '#FAF7F2',
          slateBg: '#F6ECE8',
          textPrimary: '#554B49',
          textSecondary: '#665A55',
        }
      },
      fontFamily: {
        headline: ['"Plus Jakarta Sans"', 'Outfit', 'Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        nav: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        numeric: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        signage: ['"Plus Jakarta Sans"', 'Outfit', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'warm-sm': '0 2px 8px -1px rgba(234, 88, 12, 0.08), 0 1px 3px -1px rgba(0, 0, 0, 0.05)',
        'warm-md': '0 8px 24px -4px rgba(234, 88, 12, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'warm-lg': '0 16px 32px -6px rgba(234, 88, 12, 0.16), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        'card-soft': '0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 4px 10px -3px rgba(15, 23, 42, 0.03)',
      }
    },
  },
  plugins: [],
}
