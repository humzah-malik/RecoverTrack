// src/pages/Dashboard.tsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';                                  // for computing dates
import { useQueryClient } from '@tanstack/react-query';     // for invalidating recovery on save
import { useQuery } from '@tanstack/react-query';

import DailyAccordion from '../components/DailyAccordion';  // your new accordion component
import RecoveryScoreDisplay from '../components/RecoveryScoreDisplay';
import { Avatar } from '../components/Avatar';
import { useProfile } from '../hooks/useProfile';
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDailyLog } from '../components/DailyLog';   // ← existing hook
import MetricCard from '../components/MetricCard';
import { useDailyDigest } from '../hooks/useDailyDigest';
import { DigestAlerts }    from '../components/DigestAlerts';
import { DigestTips }      from '../components/DigestTips';
import { getRecovery } from '../api/recovery';
import CheckinCard from '../components/CheckinCard';
import DailyLogModal from '../components/DailyLogModal';
import { useState } from 'react';

export default function Dashboard() {
  /* --- navigation data & route helpers ----------------------- */
  const nav = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/calendar', label: 'Calendar' },
    { to: '/trends', label: 'Trends' },
    { to: '/import', label: 'Import' },
  ];
  const navigate = useNavigate();
  const { profile } = useProfile();
  const today = dayjs().format('YYYY-MM-DD');
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1,'day').format('YYYY-MM-DD');
  //const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const activeIdx = Math.max(0, nav.findIndex(n => pathname.startsWith(n.to)));
  const { data: todayLog } = useDailyLog(today);
  const { data: tomorrowLog }  = useDailyLog(tomorrow);   // D+1 (evening values after 17h)
  const { data: yesterdayLog } = useDailyLog(yesterday);

  const hour = dayjs().hour();
  // morning is stored on today’s row
  const hasMorning = Boolean(todayLog?.sleep_start && todayLog?.sleep_end);

  // evening is stored on tomorrow’s row *once the user fills it*
  const hasEvening = Boolean(
    tomorrowLog?.trained === true &&
    (tomorrowLog?.total_sets     ?? 0) > 0 &&
    (tomorrowLog?.calories       ?? 0) > 0 &&
    (tomorrowLog?.water_intake_l ?? 0) > 0
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['recovery', today],
    queryFn: () => getRecovery({ user_id: profile!.id, date: today }),
    enabled: profile?.id && hasMorning,
    refetchOnWindowFocus: false,
    retry: false,
  });

  let bannerMessage = '';
  if (hour < 11) {
    bannerMessage = hasMorning
      ? "You're off to a strong start today 💪"
      : "Good morning! Fill in your sleep & wake-up details to see today’s recovery score.";
  } else if (hour < 17) {
    bannerMessage = hasMorning
      ? "Morning check-in done ✅"
      : "Still need to log your morning check-in 📋";
  } else if (hour < 23) {
    bannerMessage = hasEvening
      ? "Evening check-in complete!"
      : "Time to reflect on today’s training and recovery. Complete your evening check-in 🌙";
  } else {
    bannerMessage = "Hope you had a good day — see you tomorrow 💤";
  }

  const { data: digest } = useDailyDigest();
  const [modalDate, setModalDate] = useState<string | null>(null);

  const sleepDurationText =
    todayLog?.sleep_start && todayLog?.sleep_end
      ? (() => {
          const [sh, sm] = todayLog.sleep_start.split(':').map(Number);
          const [eh, em] = todayLog.sleep_end.split(':').map(Number);
          let mins = (eh * 60 + em) - (sh * 60 + sm);
          if (mins < 0) mins += 24 * 60;
          return `${(mins / 60).toFixed(1)}h`;
        })()
      : null;
  
    // Control what data is displayed
    const allowMorningEdit = hour < 17;  // disallow click after 5pm
    const showMorningData = hour < 17;
    const disableMorningCard = hour >= 17;

    // Choose log date for modal
    const handleMorningClick = () => {
      if (disableMorningCard) return;
      setModalDate(today);
    };

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
        <section className="bg-white border border-gray-200 rounded-lg p-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-extrabold mb-1">
              Welcome{profile ? `, ${profile.first_name || profile.email}!` : '!'}
            </h1>
            <p className="text-gray-600">{bannerMessage}</p>
          </div>
        </section>

        

        {/* Recovery score */}
        <section
                  aria-label="Recovery score"
                  className="bg-white border border-gray-200 rounded-lg p-10 flex flex-col items-center text-center"
                >
                  <RecoveryScoreDisplay date={today} />
                </section>
        {/* Daily logs */}
        <section aria-label="Daily logs" className="grid sm:grid-cols-2 gap-6">
          <CheckinCard
            type="evening"
            title="Evening Log"
            completed={hasEvening}
            onClick={() => setModalDate(tomorrow)}
            sections={[
              {
                title: 'Workout Log',
                fields: [
                  { label: 'Trained', value: tomorrowLog?.trained ? 'Yes' : 'No' },
                  { label: 'Session', value: tomorrowLog?.split },
                  { label: 'Total Sets', value: tomorrowLog?.total_sets },
                  { label: 'Failure Sets', value: tomorrowLog?.failure_sets },
                  { label: 'Total RIR', value: tomorrowLog?.total_rir },
                  { label: 'Recovery Rating', value: tomorrowLog?.recovery_rating },
                ],
              },
              {
                title: 'Nutrition',
                fields: [
                  { label: 'Calories', value: tomorrowLog?.calories },
                  { label: 'Protein (g)', value: tomorrowLog?.macros?.protein },
                  { label: 'Carbs (g)', value: tomorrowLog?.macros?.carbs },
                  { label: 'Fat (g)', value: tomorrowLog?.macros?.fat },
                ],
              },
            ]}
          />
          <CheckinCard
              type="morning"
              title="Morning Check-in"
              completed={hasMorning}
              disabled={disableMorningCard} // ✅ new
              onClick={handleMorningClick}
              sections={[
                {
                  title: 'Sleep & Wellness',
                  fields: showMorningData
                    ? [
                        { label: 'Sleep Start', value: todayLog?.sleep_start },
                        { label: 'Sleep End', value: todayLog?.sleep_end },
                        { label: 'Sleep Duration', value: sleepDurationText },
                        { label: 'Resting HR', value: todayLog?.resting_hr },
                        { label: 'HRV', value: todayLog?.hrv },
                        { label: 'Water Intake (L)', value: todayLog?.water_intake_l },
                        { label: 'Stress', value: todayLog?.stress },
                        { label: 'Motivation', value: todayLog?.motivation },
                        { label: 'Soreness', value: todayLog?.soreness },
                        { label: 'Sleep Quality', value: todayLog?.sleep_quality },
                        { label: 'Recovery Rating', value: todayLog?.recovery_rating },
                      ]
                    : [],
                },
              ]}
            />
        </section>

        {modalDate && (
          <DailyLogModal
            date={modalDate}
            isOpen={true}
            onClose={() => {
              setModalDate(null);
              queryClient.invalidateQueries({ queryKey: ['daily-log', modalDate] });
            }}
            
          />
        )}

        {/* Metric cards: always render, but blank out after 17:00
          <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
           <MetricCard
             icon="fas fa-moon"
             label="Sleep Quality"
             value={hour < 17 ? todayLog?.sleep_quality : undefined}
           />
           <MetricCard
             icon="far fa-heart"
             label="Heart Rate Variability"
             value={hour < 17 ? todayLog?.hrv : undefined}
           />
           <MetricCard
             icon="fas fa-fire"
             label="Calories"
             value={hour < 17 ? todayLog?.calories : undefined}
           />
           <MetricCard
             icon="fas fa-wave-square"
             label="Recovery Score"
             value={hour < 17 ? Math.round(todayLog?.recovery_rating ?? NaN) : undefined}
           />
           <MetricCard
             icon="fas fa-brain"
             label="Stress Level"
             value={hour < 17 ? todayLog?.stress : undefined}
           />
           <MetricCard
             icon="far fa-stopwatch"
             label="Activity Minutes"
             value={hour < 17 && todayLog?.total_sets ? todayLog.total_sets * 3 : undefined}
           />
         </section>
        */}
        
         {/* Digests: only show before 17:00 */}
         {hour < 17 && digest && <DigestAlerts alerts={digest.alerts} />}
         {hour < 17 && digest && <DigestTips   tips={digest.micro_tips} />}
      </main>
    </div>
  );
}
