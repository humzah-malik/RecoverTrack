/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      gridAutoRows: {
        '1fr': '1fr',
      },
      colors: {
        bg:            'var(--bg)',
        surface:       'var(--surface)',
        'surface-alt': 'var(--surface-alt)',
        border:        'var(--border)',
        primary:       'var(--text-primary)',
        muted:         'var(--text-muted)',
        accent:        'var(--accent)',
        'accent-hover':'var(--accent-hover)',
        success:       'var(--success)',
        danger:        'var(--danger)',
      },
      borderRadius: { card: '12px' },
      boxShadow: {
        card: '0 6px 18px rgba(222, 190, 132, 0.15)',
        cardDark: '0 6px 12px rgba(234, 208, 143, 0.1)',
        glow: '0 0 8px rgba(214, 179, 112, 0.4)', // soft ambient effect
      },
      keyframes: {
        scrollDot: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(0.6rem)' } },
        grad:      { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        gridShift: { '0%': { backgroundPosition: '0 0, 0 0' }, '100%': { backgroundPosition: '60px 60px, 60px 60px' } },
        pulseSoft: { '0%,100%': { opacity: .8 }, '50%': { opacity: 1 } },
      },
      animation: {
        'scroll-dot': 'scrollDot 1.2s ease-in-out infinite',
        'grad-slow':  'grad 18s ease-in-out infinite',
        'grid-drift': 'gridShift 60s linear infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/aspect-ratio')],
};