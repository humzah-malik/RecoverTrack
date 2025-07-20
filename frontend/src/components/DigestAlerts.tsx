import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export const DigestAlerts = ({ alerts }: { alerts: string[] }) => {
  if (!alerts.length) return null;
  return (
    <div className="digest-stack">
      {alerts.map((msg, i) => (
        <div
          key={i}
          className="digest-panel is-alert outline"
          style={{
            // override accent for alerts (danger)
            '--digest-accent': 'var(--danger)',
            '--digest-accent-rgb': '255 111 111'
          } as React.CSSProperties}
        >
          <span className="digest-icon">
            <ExclamationTriangleIcon className="w-3.5 h-3.5" />
          </span>
            <span className="digest-text">{msg}</span>
        </div>
      ))}
    </div>
  );
};