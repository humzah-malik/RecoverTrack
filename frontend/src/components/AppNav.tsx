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
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Disclosure as="header" className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-200 shadow-sm">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl h-14 flex items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-10">
                <span className="font-bold select-none">RecoveryTracker</span>
                <ul className="hidden sm:flex gap-8 text-sm font-medium">
                  {nav.map(({ to, label }) => (
                    <li key={to}>
                      <Link to={to}
                        className={[
                          'relative transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:transition-all',
                          pathname.startsWith(to)
                            ? 'text-black after:w-full after:bg-black'
                            : 'text-gray-600 hover:text-gray-900 after:w-0 after:bg-black/80 hover:after:w-full'
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
                    <Link to="/profile" aria-label="User profile" className="hidden sm:inline-block">
                      <Avatar user={profile} size={2} className="w-8 h-8" />
                    </Link>
                    <button
                      onClick={() => {
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        navigate('/auth/login');
                      }}
                      className="text-sm text-gray-600 hover:text-black border border-gray-300 px-3 py-1 rounded"
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