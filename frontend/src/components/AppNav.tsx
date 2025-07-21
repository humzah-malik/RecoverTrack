// src/components/AppNav.tsx
import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Avatar } from '../components/Avatar';
import { useProfile } from '../hooks/useProfile';

export default function AppNav({ children }: { children: ReactNode }) {
  const nav = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/calendar', label: 'Calendar' },
    { to: '/trends', label: 'Trends' },
    { to: '/import', label: 'Import' },
  ];
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-bg text-primary">
      <Disclosure as="header" className="sticky top-0 z-20 bg-surface/80 backdrop-blur border-b border-border shadow-sm">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl h-14 flex items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-10">
              <Link
                to="/"
                className="flex items-center gap-2 font-bold select-none text-primary hover:text-accent transition-colors"
              >
                <i className="fas fa-wave-square text-xl text-accent" />
                <span>RecoverTrack</span>
              </Link>
                <ul className="hidden sm:flex gap-8 text-sm font-medium">
                  {nav.map(({ to, label }) => (
                    <li key={to}>
                      <Link to={to}
                        className={[
                          'relative transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:transition-all',
                          pathname.startsWith(to)
                            ? 'text-primary after:w-full after:bg-accent'
                            : 'text-muted hover:text-primary after:w-0 after:bg-accent/80 hover:after:w-full'
                        ].join(' ')}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-4">
                {profile && (
                  <>
                    <Link
                      to="/profile"
                      aria-label="User profile"
                      className="block sm:inline-block"
                    >
                      <Avatar user={profile} size={2} className="w-8 h-8" />
                    </Link>
                    <button
                      onClick={() => {
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        navigate('/auth/login');
                      }}
                      className="text-sm text-muted hover:text-primary border border-border px-3 py-1 rounded"
                    >
                      Log Out
                    </button>
                  </>
                )}
                <Disclosure.Button className="sm:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400">
                  {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                </Disclosure.Button>
              </div>

            </div>
            <Disclosure.Panel className="sm:hidden border-b border-gray-200">
              <ul className="space-y-1 px-4 pb-4 pt-2 text-sm font-medium">
                {nav.map(({ to, label }) => (
                  <li key={to}>
                    <button
                      onClick={() => {
                        navigate(to);
                        if (document.activeElement instanceof HTMLElement) {
                          document.activeElement.blur();
                        }
                      }}
                      className={pathname.startsWith(to) ? 'text-black' : 'text-gray-700 hover:text-black'}
                    >
                      {label}
                    </button>
                  </li>
                ))}

              <li>
                  <button
                    onClick={() => {
                      navigate('/profile');
                      if (document.activeElement instanceof HTMLElement) {
                        document.activeElement.blur();
                      }
                    }}
                    className={pathname === '/profile' ? 'text-black' : 'text-gray-700 hover:text-black'}
                  >
                    Profile
                  </button>
                </li>
              </ul>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {children}
      </main>
    </div>
  );
}