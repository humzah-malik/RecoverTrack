// src/components/CalendarHeader.tsx
import React from 'react'
import dayjs from 'dayjs'

interface Props {
  view: 'week' | 'month'
  setView: (v: 'week' | 'month') => void
  cursor: dayjs.Dayjs
  onPrev: () => void
  onNext: () => void
}

export default function CalendarHeader({
  view,
  setView,
  cursor,
  onPrev,
  onNext,
}: Props) {
  // label for header
  const label =
    view === 'week'
      ? `${cursor.format('MMM D')} – ${cursor.add(6, 'day').format('MMM D, YYYY')}`
      : cursor.format('MMMM YYYY')

  // determine if we're already at the current period
  const atCurrentPeriod =
    view === 'week'
      ? cursor.isSame(dayjs().startOf('week'), 'day')
      : cursor.isSame(dayjs().startOf('month'), 'month')

      return (
        <div className="flex items-center gap-4 mb-6">
          {/* ‹ Prev */}
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
      
          {/* Label */}
          <h2 className="font-semibold text-gray-900 dark:text-[var(--text-primary)]">
            {label}
          </h2>
      
          {/* Next › */}
          <button
            onClick={onNext}
            disabled={atCurrentPeriod}
            className={`
              btn px-3 py-2 !rounded-md
              dark:bg-[var(--input-bg)]
              ${atCurrentPeriod
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:brightness-105'}
            `}
          >
            ▶
          </button>
      
          {/* view toggles */}
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
      )      
}