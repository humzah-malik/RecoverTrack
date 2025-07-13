import dayjs from 'dayjs';
import { useState } from 'react';
import CalendarHeader from '../components/CalendarHeader';
import CalendarGrid   from '../components/CalendarGrid';
import { useCalendarData } from '../hooks/useCalendarData';

/* small helpers for cards + legend (same as before) */
function Card({ title, value }: { title: string | number; value: string | number }) {
  return (
    <div className="border rounded-lg py-4 bg-white text-center">
      <p className="text-xs text-gray-600">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex gap-4 mt-6 text-xs">
      <span className="font-semibold">Recovery Zones</span>
      {[
        ['bg-green-400',  'Excellent (>75)'],
        ['bg-yellow-400', 'Good (55-75)'],
        ['bg-orange-400', 'Fair (40-55)'],
        ['bg-red-500',    'Poor (<40)'],
        ['bg-gray-200',   'Rest / Pending'],
      ].map(([c, l]) => (
        <div key={l} className="flex items-center gap-1">
          <div className={`w-4 h-4 rounded-full ${c}`} />
          <span>{l}</span>
        </div>
      ))}
    </div>
  );
}

export default function CalendarPage() {
  const [view, setView]  = useState<'week' | 'month'>('month');
  const [cursor, setCur] = useState(dayjs().startOf('month'));

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
        <div className="flex justify-between items-center border p-4 rounded-lg mb-6 text-sm">
          <span>Want to fill the gaps? Try bulk import</span>
          <a href="/import" className="px-4 py-2 bg-black text-white rounded-md">
            Import Data
          </a>
        </div>
      )}

      <div className="border border-black/10 rounded-lg p-3">
      <CalendarGrid
        view={view}
        cursor={cursor}
        dayStates={dayStates}
        onSelect={() => {/* TODO: open day modal */}}
      />
      </div>

      {view === 'month' && <Legend />}
    </div>
  );
}