export function BackgroundGradient() {
    return (
      <div
        aria-hidden
        className="
          pointer-events-none fixed inset-0 z-0 opacity-35
          animate-grad-slow
          bg-grad-light dark:bg-grad-dark
        "
      />
    );
  }  