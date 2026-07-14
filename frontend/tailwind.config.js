/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F2A4A',
          light: '#1D4E89',
          dark: '#081A30',
        },
        steel: {
          DEFAULT: '#2F80ED',
          light: '#5B9BF2',
        },
        safe: '#16A34A',
        warning: '#D97706',
        critical: '#DC2626',
        surface: '#F4F6F9',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 42, 74, 0.08), 0 1px 2px rgba(15, 42, 74, 0.06)',
        elevated: '0 10px 25px -5px rgba(15, 42, 74, 0.15)',
      },
      borderRadius: {
        xl: '0.875rem',
      },
    },
  },
  plugins: [],
}
