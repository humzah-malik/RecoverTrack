// src/components/ThemeToggle.tsx
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid'

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // avoid hydration mismatch
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  // decide which theme is active
  const current = theme === 'system' ? systemTheme : theme

  // toggle handler
  const toggle = () =>
    setTheme(current === 'dark' ? 'light' : 'dark')

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="fixed bottom-4 right-4 z-50 focus:outline-none"
    >
      <div
        className={
          // track
          `w-14 h-8 flex items-center p-1 rounded-full transition-colors
           ${current === 'dark' ? 'bg-surface-dark' : 'bg-gray-300'}`
        }
      >
        <div
          className={
            // knob
            `bg-white w-6 h-6 rounded-full shadow-md transform transition-transform
             ${current === 'dark' ? 'translate-x-6' : 'translate-x-0'}`
          }
        >
          <div className="flex items-center justify-center h-full">
            {current === 'dark' ? (
              <MoonIcon className="w-4 h-4 text-primary" />
            ) : (
              <SunIcon className="w-4 h-4 text-accent" />
            )}
          </div>
        </div>
      </div>
    </button>
  )
}