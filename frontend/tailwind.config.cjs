/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#6366F1', dark: '#4F46E5' },
        accent:  { DEFAULT: '#F59E0B' },
        glass:   'rgba(255, 255, 255, 0.1)',
      },
      fontFamily: {
        sans: ['Sora', 'system-ui', 'sans-serif'],
      },
      animation: {
        'gradient-x': 'gradient-x 20s ease infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: false,
  },
};