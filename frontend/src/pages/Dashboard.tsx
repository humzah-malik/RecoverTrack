import dayjs from 'dayjs'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import AppNav from '../components/AppNav'
import RecoveryScoreDisplay from '../components/RecoveryScoreDisplay'
import { useProfile } from '../hooks/useProfile'
import { useDailyLog } from '../components/DailyLog'
import CheckinCard from '../components/CheckinCard'
import DailyLogModal from '../components/DailyLogModal'
import { useDailyDigest } from '../hooks/useDailyDigest'
import { DigestAlerts } from '../components/DigestAlerts'
import { DigestTips } from '../components/DigestTips'
import { getRecovery } from '../api/recovery'
import { useState } from 'react'
import BackgroundEffects from "../components/BackgroundEffects";
import BackgroundGradient from '../components/BackgroundGradient'

export default function Dashboard() {
  const { profile } = useProfile()
  const queryClient = useQueryClient()

  const today     = dayjs().format('YYYY-MM-DD')
  const tomorrow  = dayjs().add(1, 'day').format('YYYY-MM-DD')
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  const hour      = dayjs().hour()
  const scoreDate = hour < 17 ? today : tomorrow

  const eveningDate  = hour < 17 ? today : tomorrow
  const eveningTitle =
    hour < 17
      ? "Evening Log (Yesterday’s Workout & Macros)"
      : "Evening Log (Today’s Workout & Macros)"

  const { data: todayLog }     = useDailyLog(today)
  const { data: eveningLog }   = useDailyLog(eveningDate)
  const { data: yesterdayLog } = useDailyLog(yesterday) // kept in case used later

  const hasMorning = Boolean(
    todayLog?.sleep_start && todayLog?.sleep_end
  )

  const hasEvening = Boolean(
    eveningLog?.trained === true &&
    (eveningLog?.total_sets     ?? 0) > 0 &&
    (eveningLog?.calories       ?? 0) > 0 &&
    (eveningLog?.water_intake_l ?? 0) > 0
  )

  const { data: recovery } = useQuery({
       queryKey: ['recovery', scoreDate],
       queryFn: () => getRecovery({ user_id: profile!.id, date: scoreDate }),
       enabled: profile?.id != null && (hour < 17 ? hasMorning : false),
        refetchOnWindowFocus: false,
        retry: false,
      })

  let bannerMessage = ''
  if (hour < 11) {
    bannerMessage = hasMorning
      ? "You're off to a strong start today 💪"
      : "Good morning! Fill in your sleep & wake‑up details to see today’s recovery score."
  } else if (hour < 17) {
    bannerMessage = hasMorning
      ? "Morning check‑in done ✅"
      : "Still need to log your morning check‑in 📋"
  } else if (hour < 23) {
    bannerMessage = hasEvening
      ? "Evening check‑in complete!"
      : "Time to reflect on today’s training and recovery. Complete your evening check‑in 🌙"
  } else {
    bannerMessage = "Hope you had a good day — see you tomorrow 💤"
  }

  const { data: digest } = useDailyDigest()
  const [modalDate, setModalDate] = useState<string | null>(null)

  const sleepDurationText =
    todayLog?.sleep_start && todayLog?.sleep_end
      ? (() => {
          const [sh, sm] = todayLog.sleep_start.split(':').map(Number)
          const [eh, em] = todayLog.sleep_end.split(':').map(Number)
          let mins = (eh * 60 + em) - (sh * 60 + sm)
          if (mins < 0) mins += 24 * 60
          return `${(mins / 60).toFixed(1)}h`
        })()
      : null

  const disableMorningCard = hour >= 17
  const showMorningData    = hour < 17

  function handleMorningClick() {
    if (!disableMorningCard) setModalDate(today)
  }

  return (
    <AppNav>
      <main
        className="
          max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10
          text-[15px]
        "
      >
      <div className="pointer-events-none absolute inset-0 z-0">
        <BackgroundEffects />
        <BackgroundGradient />
      </div>
        {/* ── Banner ───────────────────────────────── */}
        <div className="card-glow hoverable">
          <section
            className="
              card-base p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4  accent-outline accent-alt-swap
            "
            aria-label="Welcome banner"
          >
            <div>
              <h1 className="text-xl font-extrabold mb-1 tracking-tight">
                Welcome{profile ? `, ${profile.first_name || profile.email}!` : '!'}
              </h1>
              <p className="text-muted">{bannerMessage}</p>
            </div>
            {/* Future: quick actions / streak summary */}
          </section>
        </div>

        {/* ── Recovery Score ───────────────────────── */}
        <div className="card-glow hoverable">
        <section
          aria-label="Recovery score"
          className="card-base p-8 sm:p-10 flex flex-col items-center text-center gap-4"
        >
          <RecoveryScoreDisplay date={scoreDate} />
          {!recovery && hasMorning && (
            <p className="text-muted text-xs">
              Generating recovery score…
            </p>
          )}
        </section>
        </div>

        {/* ── Daily Logs (Check-in Cards) ──────────── */}
        <section
          aria-label="Daily logs"
          className="grid sm:grid-cols-2 gap-6"
        >
            <CheckinCard
              type="evening"
              title="Training & Macros Log"
              variant="cyan"          // NEW
              glowAlt                 // optional: cyan glow
              accentStyle="outline"       // try 'side' or 'outline'
              completed={hasEvening}
              onClick={() => setModalDate(eveningDate)}
              sections={[
                {
                  title: 'Workout Log',
                  fields: [
                    { label: 'Trained',        value: eveningLog?.trained ? 'Yes' : 'No' },
                    { label: 'Session',        value: eveningLog?.split },
                    { label: 'Total Sets',     value: eveningLog?.total_sets },
                    { label: 'Failure Sets',   value: eveningLog?.failure_sets },
                    { label: 'Total RIR',      value: eveningLog?.total_rir },
                    { label: 'Recovery Rating', value: eveningLog?.recovery_rating },
                  ],
                },
                {
                  title: 'Nutrition',
                  fields: [
                    { label: 'Calories',    value: eveningLog?.calories },
                    { label: 'Protein (g)', value: eveningLog?.macros?.protein },
                    { label: 'Carbs (g)',   value: eveningLog?.macros?.carbs },
                    { label: 'Fat (g)',     value: eveningLog?.macros?.fat },
                    { label: 'Water Intake (L)',  value: eveningLog?.water_intake_l },
                  ],
                },
              ]}
            />

            
              <CheckinCard
                type="morning"
                className={disableMorningCard ? 'opacity-80' : ''}
                title="Recovery & Sleep Check‑In"
                variant="gold"
                accentStyle="outline"       // or 'outline' to compare
                completed={hasMorning}
                disabled={disableMorningCard}
                onClick={handleMorningClick}
                sections={[
                  {
                    title: 'Sleep & Wellness',
                    fields: showMorningData
                      ? [
                          { label: 'Sleep Start',       value: todayLog?.sleep_start },
                          { label: 'Sleep End',         value: todayLog?.sleep_end },
                          { label: 'Sleep Duration',    value: sleepDurationText },
                          { label: 'Resting HR',        value: todayLog?.resting_hr },
                          { label: 'HRV',               value: todayLog?.hrv },
                          { label: 'Stress',            value: todayLog?.stress },
                          { label: 'Motivation',        value: todayLog?.motivation },
                          { label: 'Soreness',          value: todayLog?.soreness },
                          { label: 'Sleep Quality',     value: todayLog?.sleep_quality },
                        ]
                      : [],
                  },
                ]}
              />
        </section>

        {/* ── Digest (Conditional) ─────────────────── */}
        {hour < 17 && digest && (
          <div className="space-y-6">
            <div className="card-glow hoverable">
              <DigestAlerts alerts={digest.alerts} />
            </div>
            <div className="card-glow hoverable">
              <DigestTips tips={digest.micro_tips} />
            </div>
          </div>
        )}

        

        {/* ── Modal ────────────────────────────────── */}
        {modalDate && (
          <DailyLogModal
            date={modalDate}
            isOpen
            onClose={() => {
              setModalDate(null)
              queryClient.invalidateQueries({ queryKey: ['daily-log', modalDate] })
            }}
          />
        )}
      </main>
    </AppNav>
  )
}