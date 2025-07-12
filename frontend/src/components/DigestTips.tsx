// src/components/DigestTips.tsx  (blue micro-tips)
import { InformationCircleIcon } from '@heroicons/react/24/outline';

export const DigestTips = ({ tips }: { tips: string[] }) => {
  if (!tips.length) return null;
  return (
    <div className="space-y-2">
      {tips.map((msg, i) => (
        <div
          key={i}
          className="flex items-center gap-2 border border-blue-300 bg-blue-50 text-blue-700 px-4 py-2 rounded"
        >
          <InformationCircleIcon className="w-5 h-5 shrink-0" />
          <span className="text-sm">{msg}</span>
        </div>
      ))}
    </div>
  );
};