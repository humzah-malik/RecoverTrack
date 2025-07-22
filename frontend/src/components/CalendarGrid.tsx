import dayjs from 'dayjs';
import DayCell from './DayCell';
import type { DayState } from '../hooks/useCalendarData';

interface Props {
  view: 'week' | 'month';
  cursor: dayjs.Dayjs;
  dayStates: Record<string, DayState>;
  onSelect: (d: dayjs.Dayjs) => void;
}

export default function CalendarGrid({
  view,
  cursor,
  dayStates,
  onSelect,
}: Props) {
  /* -------------------------------------------------- build day array */
  let days: (dayjs.Dayjs | null)[] = [];

  if (view === 'week') {
    const start = cursor.startOf('week'); // Sunday
    days = Array.from({ length: 7 }, (_, i) => start.add(i, 'day'));
  } else {
    const start    = cursor.startOf('month');
    const leading  = start.day();               // 0 = Sun … 6 = Sat
    const numDays  = cursor.daysInMonth();
    const trailing = (7 - ((leading + numDays) % 7)) % 7;

    days = [
      ...Array.from({ length: leading }).map(() => null),
      ...Array.from({ length: numDays }, (_, i) => start.add(i, 'day')),
      ...Array.from({ length: trailing }).map(() => null),
    ];
  }

  /* -------------------------------------------------- classes & style */
  const gridClass = `
    grid grid-cols-7 auto-rows-[1fr]
    ${view === 'week' ? 'gap-1 sm:gap-4' : 'gap-1 sm:gap-3'}
  `;

  const gridStyle =
    view === 'month'
      ? { minHeight: '54vw' }                     // 6 rows × col‑width
      : { minHeight: 'clamp(90px, 12vw, 150px)' };// 1 row  × col‑width

  /* -------------------------------------------------- render */
  return (
    <div>
      {/* ---------- weekday labels ---------- */}
      <div
        className={`
          grid grid-cols-7
          text-center text-xs font-semibold
          text-gray-500 dark:text-[var(--text-muted)]
          ${view === 'week' ? 'gap-1 sm:gap-4 mb-1' : 'gap-1 sm:gap-3 mb-2'}
        `}
      >
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(label => (
          <div key={label} className="py-1">{label}</div>
        ))}
      </div>

      {/* ---------- day cells grid ---------- */}
      <div className={gridClass.trim()} style={gridStyle}>
        {days.map((d, i) =>
          d ? (
            <div key={d.format('YYYY-MM-DD')} className="w-full aspect-square">
              <DayCell
                date={d}
                data={dayStates[d.format('YYYY-MM-DD')] ?? { state: 'pending' }}
                onClick={() => onSelect(d)}
                className="w-full h-full"
              />
            </div>
          ) : (
            <div key={`blank-${i}`} className="aspect-square" />
          )
        )}
      </div>
    </div>
  );
}