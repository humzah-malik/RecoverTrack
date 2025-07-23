export function BackgroundGrid() {
    return (
      <div
        aria-hidden
        className="
          pointer-events-none fixed inset-0 z-0 opacity-25
          animate-grid-drift
          bg-grid-light dark:bg-grid-dark
        "
      />
    );
  }  