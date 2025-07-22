// src/pages/Calendar.tsx
import React, { useState } from 'react';
import dayjs from 'dayjs';
import CalendarHeader from '../components/CalendarHeader';
import CalendarGrid   from '../components/CalendarGrid';
import { useCalendarData } from '../hooks/useCalendarData';
import DailyLogModal from '../components/DailyLogModal';

/* small helper for the header cards */
function Card({ title, value }: { title: string | number; value: string | number }) {
  return (
    <div
      className="
        card-base flex flex-col items-center justify-center
        py-4
        bg-white dark:bg-[var(--surface-alt)]
      "
    >
      <p className="text-xs text-gray-600 dark:text-[var(--text-muted)]">{title}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

/* updated Legend: title + flex‑wrap container */
function Legend() {
  return (
    <div className="mt-6 text-xs">
      <p className="font-semibold mb-2 text-center">Recovery Zones</p>
      <div className="flex flex-wrap justify-center gap-4">
      {[
          ['var(--zone-excellent)', 'Excellent (>75)'],
          ['var(--zone-good)',      'Good (55–75)'],
          ['var(--zone-fair)',      'Fair (40–55)'],
          ['var(--zone-poor)',      'Poor (<40)'],
          ['var(--zone-track)',     'Rest / Pending'],
        ].map(([c, label]) => (
          <div key={label} className="flex items-center gap-1">
            <span
              className="w-4 h-4 rounded-full"
              style={{ background:c as string }}
            />
            <span className="text-gray-800 dark:text-[var(--text-primary)]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [view, setView]  = useState<'week' | 'month'>('month');
  const [cursor, setCur] = useState(dayjs().startOf('month'));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { dayStates, stats } = useCalendarData(view, cursor);

  const prev = () =>
    setCur(view === 'week'
      ? cursor.subtract(1, 'week').startOf('week')
      : cursor.subtract(1, 'month').startOf('month'));

  const next = () =>
    setCur(view === 'week'
      ? cursor.add(1, 'week').startOf('week')
      : cursor.add(1, 'month').startOf('month'));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <CalendarHeader
        view={view}
        setView={setView}
        cursor={cursor}
        onPrev={prev}
        onNext={next}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card
          title={view === 'week' ? 'Weekly Avg' : 'Monthly Avg'}
          value={stats.average.toFixed(0)}
        />
        <Card title="Training Days" value={stats.trainingDays} />
        <Card title="Rest Days"     value={stats.restDays} />
        <Card title="Missing Logs"  value={stats.pendingDays} />
      </div>

      {stats.pendingDays >= 7 && (
        <div
          className="
            card-base p-4 mb-6 flex justify-between items-center text-sm
            bg-white dark:bg-[var(--surface-alt)]
          "
        >
          <span className="text-gray-800 dark:text-[var(--text-primary)]">
            Want to fill the gaps? Try bulk import
          </span>

          <a href="/import" className="btn-dark px-4 py-2 rounded-md">
            Import Data
          </a>
        </div>
      )}

      {/* make the calendar horizontally scrollable on small screens */}
      <div
        className="
          overflow-x-auto
          card-base p-4
          bg-white dark:bg-[var(--surface)]
        "
      >
        <CalendarGrid
          view={view}
          cursor={cursor}
          dayStates={dayStates}
          onSelect={d => setSelectedDate(d.format('YYYY-MM-DD'))}
        />
      </div>

      {<Legend />}

      {selectedDate && (
        <DailyLogModal
          date={selectedDate}
          isOpen
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}