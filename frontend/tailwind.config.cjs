/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Neutral tokens (light)
        bg:            'var(--bg)',
        surface:       'var(--surface)',
        'surface-alt': 'var(--surface-alt)',
        border:        'var(--border)',
        primary:       'var(--text-primary)',
        muted:         'var(--text-muted)',
        accent:        'var(--accent)',
        'accent-hover':'var(--accent-hover)',
    
        // Optional: semantic tokens
        success:       'var(--success)',
        danger:        'var(--danger)',
      },
      borderRadius: { card: '12px' }, // more elegant
      boxShadow: {
        card: '0 6px 18px rgba(222, 190, 132, 0.15)', // warm gold glow
        cardDark: '0 6px 12px rgba(234, 208, 143, 0.1)',
      },
    }    
  },
};