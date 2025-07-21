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
          /* weekday labels for header row */
          const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            
          /* ---------------- compute dates ---------------- */
          let days: (dayjs.Dayjs | null)[] = []
        
          if (view === 'week') {
            /* startOf('week') already gives Sunday for dayjs default locale */
            const start = cursor.startOf('week')
            days = Array.from({ length: 7 }, (_, i) => start.add(i, 'day'))
          } else {
            /* month view — add leading & trailing fillers */
            const start = cursor.startOf('month')
            const leading = start.day() /* 0 = Sun, 6 = Sat */
            const numDays  = cursor.daysInMonth()
            const trailing = (7 - ((leading + numDays) % 7)) % 7
        
            days = [
              ...Array.from({ length: leading }).map(() => null),
              ...Array.from({ length: numDays }, (_, i) => start.add(i, 'day')),
              ...Array.from({ length: trailing }).map(() => null),
            ]
          }

  return (
    <div className="space-y-1">
      {/* ── header row ─────────────────────────────── */}
      <div className="grid grid-cols-7 text-center text-[11px] sm:text-xs font-medium text-muted">
        {weekdays.map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* ── day cells ─────────────────────────────── */}
      <div
        className={`
          grid grid-cols-7
          ${view === 'week' ? 'gap-1 sm:gap-4' : 'gap-1 sm:gap-3'}
        `}
      >
        {days.map((d, i) =>
          d ? (
            <DayCell
              key={d.format('YYYY-MM-DD')}
              date={d}
              data={dayStates[d.format('YYYY-MM-DD')] ?? { state: 'pending' }}
              onClick={() => onSelect(d)}
            />
          ) : (
            <div key={`blank-${i}`}/>
          )
        )}
      </div>
    </div>
  );
}