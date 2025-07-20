import dayjs from 'dayjs';
import type { DayState } from '../hooks/useCalendarData';

interface Props {
  date: dayjs.Dayjs;
  data: DayState;
  onClick: () => void;
}

/* generic wrapper */
const BASE =
  'relative aspect-square rounded-md select-none cursor-pointer ' +
  'flex flex-col items-center justify-center font-semibold text-sm ' +
  'ring-1 ring-black/5 dark:ring-[var(--divider)]';

/* colour mapping driven by CSS tokens we just fixed */
const COLORS = {
  excellent : 'bg-[var(--zone-excellent)] text-white',
  good      : 'bg-[var(--zone-good)]      text-gray-900',
  fair      : 'bg-[var(--zone-fair)]      text-gray-900',
  poor      : 'bg-[var(--zone-poor)]      text-white',
  rest      : 'bg-gray-100  dark:bg-[var(--surface-alt)] text-gray-800 dark:text-[var(--text-primary)]',
  pending   : 'bg-gray-50   dark:bg-[var(--surface-alt)] text-gray-400'
} as const;

export default function DayCell({ date, data, onClick }: Props) {
  /* decide colour bucket */
  const bucket =
    data.state === 'scored'
      ? (data.score! > 75 ? 'excellent'
         : data.score! >= 55 ? 'good'
         : data.score! >= 40 ? 'fair'
         : 'poor')
      : data.state === 'rest-scored'
        ? 'rest'
        : data.state;                       // 'rest' | 'pending'

  const corner = bucket === 'pending' || bucket === 'rest' ? 'right-1' : 'left-1';

  return (
    <div onClick={onClick} className={`${BASE} ${COLORS[bucket]}`}>
      {/* calendar‑day number */}
      <span className={`absolute top-1 ${corner} text-[10px]`}>{date.date()}</span>

      {/* conditional inner UI */}
      {data.state === 'scored' && (
        <>
          <span className="text-xl font-bold">{Math.round(data.score!)}</span>
          <span className="-rotate-45 mt-0.5 text-[10px]">🏋️‍♂️</span>
        </>
      )}

      {data.state === 'rest-scored' && (
        <>
          <span className="text-xl font-bold">{Math.round(data.score!)}</span>
          <span className="text-[11px] mt-0.5">Rest</span>
        </>
      )}

      {data.state === 'rest'  && <span>Rest</span>}
      {data.state === 'pending' && '–'}
    </div>
  );
}