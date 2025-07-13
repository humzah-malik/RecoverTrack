import dayjs from 'dayjs';
import DayCell from './DayCell';
import type { DayState } from '../hooks/useCalendarData';

interface Props {
  view: 'week' | 'month';
  cursor: dayjs.Dayjs;
  dayStates: Record<string, DayState>;
  onSelect: (d: dayjs.Dayjs) => void;
}

export default function CalendarGrid({ view, cursor, dayStates, onSelect }: Props) {
  const days = view === 'week'
    ? Array.from({ length: 7 }, (_, i) => cursor.startOf('week').add(i, 'day'))
    : Array.from({ length: cursor.daysInMonth() }, (_, i) => cursor.startOf('month').add(i, 'day'));

  return (
    <div
      className={view==='week'
        ? 'grid grid-cols-7 gap-4'
        : 'grid grid-cols-7 gap-3'}
    >
      {days.map(d => (
        <DayCell
          key={d.format('YYYY-MM-DD')}
          date={d}
          data={dayStates[d.format('YYYY-MM-DD')] ?? { state: 'pending' }}
          onClick={() => onSelect(d)}
        />
      ))}
    </div>
  );
}