// src/pages/Dashboard.tsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { useProfile } from '../hooks/useProfile';
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Dashboard() {
  /* --- navigation data & route helpers ----------------------- */
  const nav = [
    { to: '/', label: 'Dashboard' },
    { to: '/calendar', label: 'Calendar' },
    { to: '/trends', label: 'Trends' },
    { to: '/import', label: 'Import' },
  ];
  const navigate = useNavigate();
  const { profile, isLoading } = useProfile();
  const { pathname } = useLocation();
  const activeIdx = Math.max(0, nav.findIndex(n => pathname.startsWith(n.to)));

  /* ----------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* ── NAVBAR / DISCLOSURE ─────────────────────────────── */}
      <Disclosure
        as="header"
        className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-200 shadow-sm"
      >
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl h-14 flex items-center justify-between px-4 sm:px-6 lg:px-8">
              {/* logo + (desktop) links */}
              <div className="flex items-center gap-10">
                <span className="font-bold select-none">RecoveryTracker</span>

                <ul className="hidden sm:flex gap-8 text-sm font-medium">
                  {nav.map(({ to, label }) => (
                    <li key={to}>
                      <Link
                        to={to}
                        className={[
                          'relative transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:transition-all',
                          pathname.startsWith(to)
                            ? 'text-black after:w-full after:bg-black'
                            : 'text-gray-600 hover:text-gray-900 after:w-0 after:bg-black/80 hover:after:w-full',
                        ].join(' ')}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* avatar + burger */}
              <div className="flex items-center gap-4">
              {profile && (
                  <Link to="/profile" aria-label="User profile" className="hidden sm:inline-block">
                    <Avatar user={profile} size={2} className="w-8 h-8" />  {/* w-10 h-10 */}
                  </Link>
                )}
                <Disclosure.Button className="sm:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400">
                  {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                </Disclosure.Button>
              </div>
            </div>

            {/* mobile panel */}
            <Disclosure.Panel className="sm:hidden border-b border-gray-200">
              <ul className="space-y-1 px-4 pb-4 pt-2 text-sm font-medium">
                {nav.map(({ to, label }, idx) => (
                  <li key={to}>
                    <button
                      onClick={() => {
                        navigate(to);
                        /* close panel after click */
                        document.activeElement instanceof HTMLElement &&
                          document.activeElement.blur();
                      }}
                      className={
                        pathname.startsWith(to) ? 'text-black' : 'text-gray-700 hover:text-black'
                      }
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      {/* ── MAIN ─────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Welcome box */}
        <section className="bg-white border border-gray-200 rounded-lg p-6 flex items-center gap-6">
          <div>
            <h1 className="text-xl font-extrabold mb-1">
              Welcome{profile ? `, ${profile.first_name || profile.email}!` : '!'}
            </h1>
            <div className="flex gap-4">
              <p className="text-gray-500 text-sm mb-4">Let’s set your baseline</p>

              <div className="flex gap-4">
                <button className="bg-black text-white text-xs font-semibold px-4 py-2 rounded focus:ring-2 focus:ring-black">
                  Log Yesterday&#39;s Workout
                </button>
                <button className="border border-gray-300 text-xs px-4 py-2 rounded focus:ring-2 focus:ring-gray-300">
                  Skip (Rest Day)
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Recovery score */}
        <section
          aria-label="Recovery score"
          className="bg-white border border-gray-200 rounded-lg p-10 flex flex-col items-center text-center"
        >
          <div className="w-24 h-24 rounded-full border-2 border-gray-300 flex items-center justify-center mb-4">
            <span className="text-2xl font-extrabold">--</span>
          </div>
          <p className="font-semibold mb-1">No recovery score yet</p>
          <p className="text-gray-500 text-xs">Complete at least one daily log</p>
        </section>

        {/* Daily logs */}
        <section aria-label="Daily logs" className="space-y-4">
          {[
            { icon: 'fas fa-flag', label: 'Morning Check-in', open: true },
            { icon: 'fas fa-dumbbell', label: 'Evening Log', open: false },
          ].map(({ icon, label, open }) => (
            <details key={label} open={open} className="border-b border-gray-200 pb-2">
              <summary className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <i className={`${icon} text-xs`} /> {label}
              </summary>
            </details>
          ))}
        </section>

        {/* Metric cards */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: 'fas fa-moon', label: 'Sleep Quality' },
            { icon: 'far fa-heart', label: 'Heart Rate Variability' },
            { icon: 'fas fa-fire', label: 'Calories' },
            { icon: 'fas fa-wave-square', label: 'Recovery Score' },
            { icon: 'fas fa-brain', label: 'Stress Level' },
            { icon: 'far fa-stopwatch', label: 'Activity Minutes' },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="bg-white border border-gray-200/70 rounded-xl p-8 flex flex-col items-center text-center text-gray-500 text-xs hover:shadow focus:shadow-md transition"
            >
              <i className={`${icon} text-lg mb-2`} />
              <p className="font-semibold mb-1">No data yet</p>
              <p>{label}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
