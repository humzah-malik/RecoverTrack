// src/components/DigestAlerts.tsx  (red rules)
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export const DigestAlerts = ({ alerts }: { alerts: string[] }) => {
  if (!alerts.length) return null;
  return (
    <div className="space-y-2">
      {alerts.map((msg, i) => (
        <div
          key={i}
          className="flex items-center gap-2 border border-red-300 bg-red-50 text-red-700 px-4 py-2 rounded"
        >
          <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
          <span className="text-sm">{msg}</span>
        </div>
      ))}
    </div>
  );
};