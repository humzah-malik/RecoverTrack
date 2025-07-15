import React from 'react';

export interface CheckinCardProps {
  type: 'morning' | 'evening';
  title: string;
  completed?: boolean;
  disabled?: boolean;
  sections: {
    title?: string;
    fields: {
      label: string;
      icon?: string;
      value?: string | number | null;
    }[];
  }[];
  onClick: () => void;
}

export default function CheckinCard({
    title,
    completed,
    disabled = false,
    sections,
    onClick,
  }: CheckinCardProps) {
    return (
      <button
        onClick={disabled ? undefined : onClick}
        className={`w-full text-left border border-gray-200 rounded-lg p-5 bg-white transition space-y-4 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'
        }`}
      >
        {/* Always render title at top */}
        <h2 className="text-lg font-bold flex items-center gap-2 text-black">
          {completed && <i className="fas fa-check" />}
          {title}
        </h2>
  
        {disabled ? (
          <div className="py-8">
            <p className="text-center text-sm text-gray-500">
              ⏳ Morning check-in opens after midnight.
            </p>
          </div>
        ) : (
          sections.map((section, idx) => (
            <div key={idx} className="space-y-2">
              {section.title && (
                <h3 className="text-sm font-semibold text-gray-500 mb-1">
                  {section.title}
                </h3>
              )}
              <dl className="text-sm space-y-2">
                {section.fields.map(({ label, value, icon }) => (
                  <div
                    key={label}
                    className="flex justify-between items-center text-gray-700"
                  >
                    <dt className="flex items-center gap-1 text-gray-500">
                      {icon && <i className={`${icon} text-xs`} />}
                      {label}
                    </dt>
                    <dd className="text-right text-black font-medium">
                      {value ?? '—'}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))
        )}
      </button>
    );
  }