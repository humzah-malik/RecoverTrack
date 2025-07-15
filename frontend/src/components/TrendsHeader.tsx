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
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm text-center">
      <p className="text-xs text-gray-600">{title}</p>
      <p className="text-xl font-bold">{value}</p>
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
          className="border px-3 py-2 rounded hover:bg-gray-100 disabled:opacity-50"
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
          className="border px-3 py-2 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          ▶
        </button>

        <div className="ml-auto flex gap-2 text-xs">
          <button
            onClick={() => setView('week')}
            className={`px-3 py-1 rounded border ${
              view === 'week' ? 'bg-black text-white' : 'hover:bg-gray-100'
            }`}
          >
            7‑Day
          </button>
          <button
            onClick={() => setView('month')}
            className={`px-3 py-1 rounded border ${
              view === 'month' ? 'bg-black text-white' : 'hover:bg-gray-100'
            }`}
          >
            30‑Day
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