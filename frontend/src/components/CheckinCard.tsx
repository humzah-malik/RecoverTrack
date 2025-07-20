import React from 'react';
import clsx from 'clsx';

export interface CheckinCardSectionField {
  label: string;
  icon?: string;
  value?: string | number | null;
}
export interface CheckinCardSection {
  title?: string;
  fields: CheckinCardSectionField[];
}

export interface CheckinCardProps {
  type: 'morning' | 'evening';
  title: string;
  completed?: boolean;
  disabled?: boolean;
  showCheck?: boolean;
  variant?: 'gold' | 'cyan';

  glowAlt?: boolean;
  compact?: boolean;
  accentStyle?: 'bar' | 'outline' | 'side' | 'inset' | 'none';
  showTypeBadge?: boolean;
  sections: CheckinCardSection[];
  onClick: () => void;
  className?: string;
}

export default function CheckinCard({
  type,
  title,
  completed = false,
  disabled = false,
  showCheck = false,
  variant = 'gold',
  glowAlt = false,
  compact = false,
  accentStyle = 'bar',
  showTypeBadge = true,
  sections,
  onClick,
  className,
}: CheckinCardProps) {

    const accentVar =
       variant === 'cyan'
         ? 'var(--accent-alt, var(--accent))'
         : 'var(--accent)';
    
    const accent = variant === 'cyan'
         ? 'var(--accent-alt, var(--accent))'
         : 'var(--accent)';
       
    const accentRgb = variant === 'cyan'
         ? 'var(--accent-alt-rgb, var(--accent-rgb))'
         : 'var(--accent-rgb)';

  function handleClick() {
    if (!disabled) onClick();
  }

  return (
    <div
      className={clsx(
        'card-glow',
        glowAlt && 'glow-alt',
        disabled && 'opacity-70',
        className
      )}
      data-accent-style={accentStyle} // debug hook
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        className={clsx(
          'card-base w-full text-left relative group transition overflow-visible',
          accentStyle !== 'bar' && accentStyle !== 'none' && 'border-transparent',
          accentStyle === 'side' && 'pl-5',
          disabled
            ? 'cursor-not-allowed'
            : 'hover:translate-y-[-2px] active:translate-y-[-1px]'
        )}
        style={{ padding: compact ? '1rem' : '1.25rem' }}
      >

        {/* Accent Treatments */}
        {accentStyle === 'bar' && (
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-[3px] rounded-t-[inherit] pointer-events-none z-[2]"
            style={{
              background: accentVar,
              boxShadow: `0 0 6px ${accentVar}, 0 0 14px ${accentVar}66`,
              opacity: disabled ? 0.4 : 1,
            }}
          />
        )}

        {accentStyle === 'outline' && (
        <span
            aria-hidden="true"
            className="absolute inset-0 rounded-[inherit] pointer-events-none z-[3]"
            style={{
            boxShadow: `
                0 0 0 1px ${accent},
                0 0 0 2px rgba(${accentRgb} / 0.15),
                0 0 8px rgba(${accentRgb} / 0.30)
            `,
            background: 'linear-gradient(145deg, rgba(255,255,255,0.02), rgba(0,0,0,0))'
            }}
        />
        )}

        {accentStyle === 'inset' && (
        <span
            aria-hidden="true"
            className="absolute inset-0 rounded-[inherit] pointer-events-none z-[3]"
            style={{
            boxShadow: `
                inset 0 0 0 1px ${accent},
                inset 0 0 4px rgba(${accentRgb} / 0.85),
                0 0 5px rgba(${accentRgb} / 0.25)
            `,
            }}
        />
        )}

        {accentStyle === 'side' && (
        <>
            <span
            aria-hidden="true"
            className="absolute left-0 top-0 bottom-0 w-[9px] rounded-l-[inherit] pointer-events-none z-[3]"
            style={{
                background: `linear-gradient(180deg,
                ${accent} 0%,
                rgba(${accentRgb} / 0.85) 55%,
                rgba(${accentRgb} / 0.25) 100%)`,
                boxShadow: `0 0 14px rgba(${accentRgb} / 0.7),
                            4px 0 10px -2px rgba(${accentRgb} / 0.55)`
            }}
            />
            <span
            aria-hidden="true"
            className="absolute left-[9px] top-0 bottom-0 w-px pointer-events-none z-[3]"
            style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.4), rgba(255,255,255,0) 70%)',
                mixBlendMode: 'screen'
            }}
            />
        </>
        )}

        {/* Header */}
        <div
          className={clsx(
            'mb-4 flex items-start justify-between gap-3',
            compact && 'mb-3'
          )}
        >
          <h2 className="text-base font-semibold tracking-tight flex items-center gap-2 text-[var(--text-primary)]">
            {title}
            {completed && showCheck && (
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
                style={{
                  background: 'var(--success)',
                  color: '#0C1A24',
                  boxShadow: '0 0 0 2px rgba(0,0,0,0.35)',
                }}
                title="Completed"
              >
                ✓
              </span>
            )}
          </h2>

          {showTypeBadge && !disabled && (
            <span
              className="text-[10px] uppercase tracking-wide font-medium px-2 py-1 rounded-md"
              style={{
                background:
                  type === 'morning'
                    ? 'rgba(214,179,112,0.12)'
                    : 'rgba(82,167,224,0.12)',
                color:
                  type === 'morning'
                    ? 'var(--accent)'
                    : 'var(--accent-alt)',
              }}
            >
              {type}
            </span>
          )}
        </div>

        {/* Body */}
        {disabled ? (
          <div className={clsx('py-10 flex items-center justify-center', compact && 'py-6')}>
            <p className="text-sm text-muted flex items-center gap-1">
              <span role="img" aria-label="hourglass">
                ⏳
              </span>
              Morning check‑in opens after midnight.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sections.map((section, idx) => {
              if (!section.fields || section.fields.length === 0) return null;
              return (
                <div key={idx} className="space-y-3">
                  {section.title && (
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {section.title}
                    </h3>
                  )}
                  <dl className="space-y-1.5">
                    {section.fields.map(({ label, value, icon }) => (
                      <div key={label} className="flex justify-between items-center py-1">
                        <dt className="flex items-center gap-2 text-[13px] text-muted">
                          {icon && (
                            <i className={clsx(icon, 'text-[11px] opacity-80')} aria-hidden="true" />
                          )}
                          <span>{label}</span>
                        </dt>
                        <dd
                          className={clsx(
                            'text-[13px] font-medium tabular-nums',
                            value == null && 'opacity-50'
                          )}
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {value ?? '—'}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
          </div>
        )}

        {/* Hover halo (skip if outline or inset) */}
        {!disabled && !['outline', 'inset'].includes(accentStyle) && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition z-[1]"
            style={{
              boxShadow: `0 0 0 1px ${accentVar}55, 0 0 18px ${accentVar}40`,
            }}
          />
        )}
      </button>
    </div>
  );
}