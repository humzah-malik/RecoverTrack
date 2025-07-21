import React from 'react'
import dayjs from 'dayjs'

interface Stats {
  average: number   // mean recovery score
  sd: number        // standard deviation
  sleep: number     // avg sleep hours
  workouts: number  // workouts per period
  macroAdherence: number // % adherence
}

interface TrendsHeaderProps {
  view: 'week' | 'month'
  setView: (v: 'week' | 'month') => void
  cursor: dayjs.Dayjs
  onPrev: () => void
  onNext: () => void
  stats: Stats
}

function Card({ title, value }: { title: string; value: string | number }) {
      /* card-base gives neutral theme‑aware surface  subtle shadow */
      return (
        <div
          className="
            card-base flex flex-col items-center justify-center p-4 text-center
            bg-white  dark:bg-[var(--surface-alt)]
          "
        >
          <p className="text-xs text-gray-600 dark:text-[var(--text-muted)]">
            {title}
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-[var(--text-primary)]">
            {value}
          </p>
        </div>
      )
    }

export default function TrendsHeader({
  view,
  setView,
  cursor,
  onPrev,
  onNext,
  stats,
}: TrendsHeaderProps) {
  // disable "next" once we've reached today (for week or month)
  const isNextDisabled = view === 'week'
    ? cursor.add(1, 'week').startOf('week').isAfter(dayjs())
    : cursor.add(1, 'month').startOf('month').isAfter(dayjs())

  return (
    <div className="space-y-6">
      {/* Navigation & Toggle */}
      <div className="flex items-center gap-4">
      <button
          onClick={onPrev}
          className="
            btn px-3 py-2 !rounded-md
            dark:bg-[var(--input-bg)]
            hover:brightness-105
          "
        >
          ◀
        </button>

        <h2 className="font-semibold">
          {view === 'month'
            ? cursor.format('MMMM YYYY')
            : `${cursor.format('MMM D')} – ${cursor.add(6, 'day').format('MMM D')}`}
        </h2>

        <button
          onClick={onNext}
          disabled={isNextDisabled}
          className={`
            btn px-3 py-2 !rounded-md
            dark:bg-[var(--input-bg)]
            ${isNextDisabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:brightness-105'}
          `}
        >
          ▶
        </button>

        <div className="ml-auto flex gap-2 text-xs">
          <button
            onClick={() => setView('week')}
            className={`px-3 py-1 rounded border border-border ${
                            view === 'week'
                              ? 'btn-dark'                                  /* filled black */
                              : 'bg-[var(--surface-alt)] hover:bg-[var(--surface)]'
            }`}
          >
            7‑Day
          </button>
          <button
            onClick={() => setView('month')}
            className={`px-3 py-1 rounded border border-border ${
                            view === 'month'
                              ? 'btn-dark'
                              : 'bg-[var(--surface-alt)] hover:bg-[var(--surface)]'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card
          title="Avg Recovery"
          value={`${stats.average.toFixed(0)} ± ${stats.sd.toFixed(1)}`}
        />
        <Card title="Avg Sleep (h)" value={stats.sleep.toFixed(1)} />
        <Card title="Workouts" value={stats.workouts} />
        <Card
          title="Macro Adherence"
          value={`${stats.macroAdherence.toFixed(0)}%`}
        />
      </div>
    </div>
  )
}