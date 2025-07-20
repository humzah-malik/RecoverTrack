// src/components/DigestTips.tsx
import { InformationCircleIcon } from '@heroicons/react/24/outline';

export const DigestTips = ({ tips }: { tips: string[] }) => {
  if (!tips.length) return null;

  return (
    <div className="space-y-2">
      {tips.map((msg, i) => (
        <div
          key={i}
          className="
            flex items-center gap-2 rounded px-4 py-2 text-sm
            /* ─ light mode ─ */
            border border-blue-300 bg-blue-50 text-blue-700
            /* ─ dark mode ─ */
            dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300
          "
        >
          <InformationCircleIcon className="w-5 h-5 shrink-0" />
          <span>{msg}</span>
        </div>
      ))}
    </div>
  );
};