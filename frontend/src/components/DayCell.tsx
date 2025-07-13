import type { DayState } from '../hooks/useCalendarData';

import dayjs from 'dayjs';

function zoneColor(score: number) {
  if (score > 75) return 'bg-green-400';
  if (score >= 55) return 'bg-yellow-400';
  if (score >= 40) return 'bg-orange-400';
  return 'bg-red-500';
}

interface Props {
  date: dayjs.Dayjs;
  data: DayState;
  onClick: () => void;
}

export default function DayCell({ date, data, onClick }: Props) {
  const base =
    'rounded-lg h-24 flex flex-col items-center justify-center text-xs cursor-pointer select-none border border-black/5 relative';

  if (data.state === 'scored') {
    return (
      <div
        onClick={onClick}
        className={`${zoneColor(data.score)} ${base} text-white`}
      >
        <span className="absolute top-1 left-1 text-[10px]">{date.date()}</span>
        <span className="text-xl font-bold">{Math.round(data.score)}</span>
        <span className="-rotate-45 mt-0.5 text-[10px]">🏋️‍♂️</span>
      </div>
    );
  }

  if (data.state === 'rest') {
    return (
      <div onClick={onClick} className={`${base} bg-gray-100 text-gray-600`}>
        <span className="absolute top-1 left-1 text-[10px]">{date.date()}</span>
        <span className="font-semibold">Rest</span>
      </div>
    );
  }

  if (data.state === 'rest-scored') {
    return (
      <div onClick={onClick} className={`${base} bg-gray-200 text-black`}>
        <span className="absolute top-1 right-1 text-[10px]">{date.date()}</span>
        <span className="text-xl font-bold">{Math.round(data.score)}</span>
        <span className="text-[11px] mt-0.5">Rest</span>
      </div>
    );
  }  

  // pending
  return (
    <div onClick={onClick} className={`${base} bg-gray-50 text-gray-400`}>
      <span className="absolute top-1 right-1 text-[10px]">{date.date()}</span>
      –
    </div>
  );
}