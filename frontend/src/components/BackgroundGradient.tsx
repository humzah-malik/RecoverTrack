export default function BackgroundGradient() {
    return (
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-35"
      >
        {/* Light Mode: soft but visible warm tones */}
        <div className="block dark:hidden w-full h-full"
          style={{
            background: 'linear-gradient(-45deg, #ffe5d4, #fddbcf, #fbe0cc, #ffede2)',
            backgroundSize: '250% 250%',
            animation: 'gradient-x 15s ease infinite',
            opacity: 0.9
          }}
        />
  
        {/* Dark Mode: rich deep tones with slight movement */}
        <div className="hidden dark:block w-full h-full"
          style={{
            background: 'linear-gradient(-45deg, #0f172a, #1e293b, #1e1b4b, #0c4a6e)',
            backgroundSize: '250% 250%',
            animation: 'gradient-x 15s ease infinite',
            opacity: 0.88
          }}
        />
      </div>
    );
  }  