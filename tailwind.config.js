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
          // Vibrant Aesthetic Safety Palette (Friendly, Human, Warm)
          red: '#DC2626',         // Vibrant Safety Crimson Red
          redDark: '#B91C1C',     // Deep Crimson
          redLight: '#FEE2E2',    // Soft Red Tint
          orange: '#EA580C',      // Cheerful Flame Orange
          orangeLight: '#FFEDD5', // Soft Orange Tint
          amber: '#F59E0B',       // Warm Saffron Gold
          amberLight: '#FEF3C7',  // Soft Amber Tint
          blue: '#2563EB',        // Trust Royal Blue
          blueDark: '#1D4ED8',    // Deep Royal Navy
          blueLight: '#DBEAFE',   // Soft Sky Blue Tint
          emerald: '#10B981',     // Verified Green
          emeraldLight: '#D1FAE5',// Soft Mint Tint
          purple: '#7C3AED',      // Engineering Purple
          purpleLight: '#EDE9FE', // Soft Lavender Tint
          
          // Canvas & Neutral Surfaces
          canvas: '#FFFFFF',      // Pure Clean White
          canvasWarm: '#FAFAF9',  // Warm Stone/Ivory 50
          canvasSlate: '#F8FAFC', // Crisp Slate 50
          borderSubtle: '#E2E8F0',// Slate 200
          textHead: '#0F172A',    // Deep Slate 900
          textBody: '#334155',    // Slate 700
          textMuted: '#64748B',   // Slate 500

          // Legacy Mappings for Seamless Compatibility
          ember: '#EA580C',
          emberDark: '#C2410C',
          gold: '#F59E0B',
          cyan: '#0284C7',
          maroon: '#B91C1C',
          maroonDark: '#991B1B',
          charcoalDark: '#0F172A',
          charcoalLight: '#334155',
          paper: '#F1F5F9',
          ivory: '#F8FAFC',
          slateBg: '#F8FAFC',
          textPrimary: '#0F172A',
          textSecondary: '#475569',
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
        'warm-sm': '0 2px 8px -1px rgba(234, 88, 12, 0.08), 0 1px 3px -1px rgba(0, 0, 0, 0.05)',
        'warm-md': '0 8px 24px -4px rgba(234, 88, 12, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'warm-lg': '0 16px 32px -6px rgba(234, 88, 12, 0.16), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        'card-soft': '0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 4px 10px -3px rgba(15, 23, 42, 0.03)',
      }
    },
  },
  plugins: [],
}
