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
          // Industrial Fire Engineering Grounded Palette
          base: '#121518',        // Machinery Graphite (Base dark)
          red: '#C81E27',         // Flat Safety Crimson (RAL 3000)
          redDark: '#A10016',     // Deep Engineering Red
          redLight: '#FEE2E2',    // Subtle Red Tint
          amber: '#D97706',       // ISO 3864 Warning Amber
          amberLight: '#FEF3C7',  // Soft Amber Warning Tint
          canvas: '#F5F6F8',      // Blueprint Drafting Off-White
          surface: '#FFFFFF',     // Specplate White
          line: '#CBD5E1',        // Galvanized Steel Line Gray
          lineDark: '#94A3B8',    // Steel Outline Gray
          textHead: '#121518',    // Machinery Iron Black
          textBody: '#334155',    // Technical Charcoal
          textMuted: '#64748B',   // Steel Gray Text
          borderSubtle: '#CBD5E1',

          // Compatibility Mappings
          orange: '#D97706',
          orangeLight: '#FEF3C7',
          blue: '#0284C7',
          blueDark: '#0369A1',
          blueLight: '#E0F2FE',
          emerald: '#10B981',
          emeraldLight: '#D1FAE5',
          purple: '#6D28D9',
          purpleLight: '#EDE9FE',
          canvasWarm: '#F5F6F8',
          canvasSlate: '#F1F5F9',
          charcoalDark: '#121518',
          charcoalLight: '#64748B',
          paper: '#F5F6F8',
          ivory: '#FFFFFF',
          slateBg: '#F8FAFC',
          textPrimary: '#121518',
          textSecondary: '#334155',
        }
      },
      fontFamily: {
        headline: ['"Barlow Condensed"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        nav: ['"Barlow Condensed"', 'sans-serif'],
        numeric: ['"IBM Plex Mono"', 'monospace'],
        signage: ['"Barlow Condensed"', 'sans-serif'],
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
