// src/layouts/AuthLayout.tsx
import type { ReactNode } from 'react'
import { NavLink, Link } from 'react-router-dom'
import BackgroundEffects from "../components/BackgroundEffects";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="
        min-h-screen flex items-center justify-center p-4
        bg-[var(--bg)] text-[var(--text-primary)]
      "
    >
      <main className="w-full max-w-sm space-y-6">
      <div className="pointer-events-none absolute inset-0 z-0">
        <BackgroundEffects />
      </div>
        {/* ── Brand header ─────────────────────────────── */}
        <header className="text-center space-y-1">
        <Link to="/" className="inline-flex items-center justify-center gap-2 group">
            <i
            className="
                fas fa-wave-square text-3xl
                text-[#00b894] dark:text-[#d6b370]
                transition-colors group-hover:opacity-90
            "
            />
            <h1 className="text-2xl font-semibold tracking-tight">
            RecoverTrack
            </h1>
        </Link>
        <p className="text-muted text-sm">Track your fitness recovery journey</p>
        </header>

        {/* ── Card shell for auth forms ────────────────── */}
        <div className="card-glow hoverable">
          <section className="card-base p-0 rounded-lg overflow-hidden">
            {/* Tabs */}
            <nav className="grid grid-cols-2 border-b border-[var(--border)]">
            <NavLink
                to="/auth/login"
                end
                className={({ isActive }) =>
                [
                    'py-3 text-center font-semibold',
                    // ALWAYS show 2‑px border bottom so the card outline is flat.
                    isActive
                    ? 'border-b-2 border-[var(--accent)] text-[var(--text-primary)]'
                    : 'border-b-2 border-transparent text-muted hover:text-[var(--text-primary)]',
                ].join(' ')
                }
            >
                Login
            </NavLink>

            <NavLink
                to="/auth/register"
                className={({ isActive }) =>
                [
                    'py-3 text-center font-semibold',
                    isActive
                    ? 'border-b-2 border-[var(--accent)] text-[var(--text-primary)]'
                    : 'border-b-2 border-transparent text-muted hover:text-[var(--text-primary)]',
                ].join(' ')
                }
            >
                Register
            </NavLink>
            </nav>

            {/* Form content */}
            <div className="p-6 space-y-5">{children}</div>
          </section>
        </div>
      </main>
    </div>
  )
}