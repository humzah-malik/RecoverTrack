import React from 'react'

interface RangeFieldProps {
  label: string
  name: string
  value: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function RangeField({
  label,
  name,
  value,
  onChange,
}: RangeFieldProps) {
  const MIN = 1
  const MAX = 5
  const percent = ((value - MIN) / (MAX - MIN)) * 100

  return (
    <div className="relative py-6">
      <label className="block text-sm font-semibold text-gray-800 mb-2">
        {label}
      </label>

      {/* bubble above the thumb */}
      <div
        className="absolute -top-4 w-6 h-6 flex items-center justify-center bg-white text-xs font-semibold text-gray-900 rounded"
        style={{ left: `calc(${percent}% - 0.75rem)` }}
      >
        {value}
      </div>

      <input
        type="range"
        name={name}
        min={MIN}
        max={MAX}
        value={value}
        onChange={onChange}
        className="w-full h-1 appearance-none rounded-lg bg-gray-200 overflow-hidden"
        style={{
          background: `linear-gradient(
            to right,
            #2563EB 0%,
            #2563EB ${percent}%,
            #E5E7EB ${percent}%,
            #E5E7EB 100%
          )`,
        }}
      />
    </div>
  )
}