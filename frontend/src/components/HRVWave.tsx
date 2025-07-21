import { memo } from "react"

/** Full‑width, infinitely‑scrolling sine wave. 100% CSS‑driven. */
function HRVWave({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`absolute inset-0 w-[200%] h-64 -z-10 select-none pointer-events-none animate-wave ${className}`}
      viewBox="0 0 1440 160"
      preserveAspectRatio="none"
    >
      {/* duplicate the path twice horizontally so the scroll loops smoothly */}
      <g stroke="currentColor" strokeWidth="2" fill="none" className="text-accent/30 dark:text-accent/15">
        <path d="M0 80 Q60 0 120 80 T240 80 T360 80 T480 80 T600 80 T720 80 T840 80 T960 80 T1080 80 T1200 80 T1320 80 T1440 80" />
        <path d="M1440 80 Q1500 0 1560 80 T1680 80 T1800 80 T1920 80" /> {/* overflow path */}
      </g>
    </svg>
  )
}

export default memo(HRVWave)