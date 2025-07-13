import dayjs from 'dayjs';

interface Props {
  view: 'week' | 'month';
  setView: (v: 'week' | 'month') => void;
  cursor: dayjs.Dayjs;
  onPrev: () => void;
  onNext: () => void;
}

export default function CalendarHeader({ view, setView, cursor, onPrev, onNext }: Props) {
  const label = view === 'week'
    ? `${cursor.format('MMM D')} – ${cursor.add(6, 'day').format('MMM D, YYYY')}`
    : cursor.format('MMMM YYYY');

  return (
    <div className="flex items-center gap-4 mb-6">
      <button onClick={onPrev} className="border px-3 py-2 rounded hover:bg-gray-100">
        ◀
      </button>

      <h2 className="font-semibold">{label}</h2>

      <button onClick={onNext} className="border px-3 py-2 rounded hover:bg-gray-100">
        ▶
      </button>

      <div className="ml-auto flex gap-2 text-xs">
        <button
          onClick={() => setView('week')}
          className={`px-3 py-1 rounded border ${view==='week'?'bg-black text-white':'hover:bg-gray-100'}`}
        >7-Day</button>
        <button
          onClick={() => setView('month')}
          className={`px-3 py-1 rounded border ${view==='month'?'bg-black text-white':'hover:bg-gray-100'}`}
        >30-Day</button>
      </div>
    </div>
  );
}