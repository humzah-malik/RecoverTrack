import React, { useMemo, useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { useProfile } from '../hooks/useProfile';
import { getRecovery } from '../api/recovery';
import type { RecoveryResponse } from '../api/recovery';

type RecoveryDebugResponse = RecoveryResponse & { ctx?: any; model_input?: any };

interface Props { date: string }

const ZONES = [
  { max: 39,  key: 'poor',      colorVar: 'var(--zone-poor)',      label: 'Poor' },
  { max: 55,  key: 'fair',      colorVar: 'var(--zone-fair)',      label: 'Fair' },
  { max: 75,  key: 'good',      colorVar: 'var(--zone-good)',      label: 'Good' },
  { max: 100, key: 'excellent', colorVar: 'var(--zone-excellent)', label: 'Excellent' },
];

function classify(score: number) {
  return ZONES.find(z => score <= z.max) ?? ZONES[ZONES.length - 1];
}

export default function RecoveryScoreDisplay({ date }: Props) {
  const hour = dayjs().hour();
  const { profile } = useProfile();

  const { data, isLoading, isError } = useQuery<RecoveryDebugResponse | null, Error>({
    queryKey: ['recovery', date],
    queryFn: () => getRecovery({ user_id: profile!.id, date }),
    enabled: Boolean(profile?.id && date),
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Score extraction
  const rawScore = data?.predicted_recovery_rating;
  const hasScore = rawScore != null;
  const score = hasScore ? Math.round(rawScore!) : 0;

  // Keep previous score for animation baseline
  const prevScoreRef = useRef(score);
  useEffect(() => {
    prevScoreRef.current = score;
  }, [score]);

  const zone = useMemo(() => classify(score), [score]);

  // Ring colors
  const trackColor = 'rgba(255,255,255,0.08)'; // fallback track in dark mode; adjust for light
  const ringAngle = (hasScore ? score : 0) * 3.6;

  // If after 5pm show the same component (you had an alternate branch)
  // but we can keep unified & just show "--" if not available.
  const displayScore = hasScore ? score : '--';

  // Accessible label
  const ariaLabel = hasScore
    ? `Recovery score ${score}, ${zone.label} zone`
    : 'Recovery score not available yet';

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Ring */}
      <div
        className="recovery-ring w-28 h-28 sm:w-32 sm:h-32 mb-4 rounded-full flex items-center justify-center relative"
        style={{
          background: hasScore
            ? `conic-gradient(${zone.colorVar} ${ringAngle}deg, ${trackColor} 0deg)`
            : `conic-gradient(${trackColor} 0deg, ${trackColor} 360deg)`,
          transition: 'background 0.9s cubic-bezier(.66,0,.34,1)'
        }}
        aria-label={ariaLabel}
        role="img"
      >
        {/* Optional faint outer border */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 4px 12px -4px rgba(0,0,0,0.6)' }}
        />
        {/* Inner disc */}
        <div
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center text-center"
          style={{
            background: 'var(--surface)',
            boxShadow: 'inset 0 0 0 1px var(--border), 0 0 0 1px rgba(255,255,255,0.02)'
          }}
        >
          <span
            className="text-3xl font-extrabold tracking-tight"
            style={{ color: 'var(--text-primary)', opacity: hasScore ? 1 : 0.6 }}
          >
            {displayScore}
          </span>
          <span
            className="mt-1 text-[11px] uppercase tracking-wide font-medium"
            style={{
              color: hasScore ? zone.colorVar : 'var(--text-muted)'
            }}
          >
            {hasScore ? zone.label : 'Pending'}
          </span>
        </div>
      </div>

      <p className="font-semibold mb-1 text-[var(--text-primary)]">Recovery Score</p>

      {!hasScore && !isLoading && !isError && (
        <p className="text-muted text-xs">Complete at least one daily log</p>
      )}

      {isLoading && (
        <p className="text-muted text-xs">Calculating…</p>
      )}
    </div>
  );
}