// src/layouts/AuthLayout.tsx
import { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 p-4">
      {/* Everything stays max-w-md (28 rem) and is centred */}
      <div className="w-full max-w-md">
        {/* ── Brand header ────────────────────────────────── */}
        <header className="flex items-center justify-center space-x-2 mb-4">
          <i className="fas fa-wave-square text-2xl" />
          <h1 className="text-2xl font-semibold">RecoverTrack</h1>
        </header>

        {/* ── Welcome copy ───────────────────────────────── */}
        <section className="text-center mb-6">
          <h2 className="text-lg font-semibold mb-1">Welcome to RecoverTrack</h2>
          <p className="text-gray-500 text-sm">
            Track your fitness recovery journey
          </p>
        </section>

        {/* ── Card shell (matches mock-up) ───────────────── */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          {/* Tabs */}
          <nav className="flex border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
            <NavLink
              to="/auth/login"
              end
              className={({ isActive }) =>
                [
                  'flex-1 py-3 text-center font-semibold rounded-t-lg',
                  isActive
                    ? 'text-black bg-white border-b-2 border-black dark:bg-gray-800'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400',
                ].join(' ')
              }
            >
              Log In
            </NavLink>
            <NavLink
              to="/auth/register"
              className={({ isActive }) =>
                [
                  'flex-1 py-3 text-center font-semibold rounded-t-lg',
                  isActive
                    ? 'text-black bg-white border-b-2 border-black dark:bg-gray-800'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400',
                ].join(' ')
              }
            >
              Register
            </NavLink>
          </nav>

          {/* Form outlet — padded exactly like mock-up */}
          <div className="p-6 space-y-5">{children}</div>
        </section>
      </div>
    </div>
  )
}