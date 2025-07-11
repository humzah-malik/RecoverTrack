import React from 'react';

interface Props {
  icon: string;          // Font-Awesome class
  label: string;
  value?: string | number | null;   // undefined → “No data yet”
}

export default function MetricCard({ icon, label, value }: Props) {
  const hasData = value !== undefined && value !== null && value !== '';

  return (
    <div className="bg-white border border-gray-200/70 rounded-xl p-8 flex flex-col items-center text-center text-xs hover:shadow transition">
      <i className={`${icon} text-lg mb-2`} />
      {hasData ? (
        <p className="text-2xl font-extrabold mb-1">{value}</p>
      ) : (
        <p className="font-semibold mb-1 text-gray-500">No data yet</p>
      )}
      <p className={hasData ? 'text-gray-700' : 'text-gray-500'}>{label}</p>
    </div>
  );
}