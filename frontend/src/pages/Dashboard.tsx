// src/pages/Dashboard.tsx
import dayjs from 'dayjs'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import AppNav from '../components/AppNav'
import DailyAccordion from '../components/DailyAccordion'
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

export default function Dashboard() {
  const { profile } = useProfile()
  const queryClient = useQueryClient()

  const today    = dayjs().format('YYYY-MM-DD')
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
  const yesterday= dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  const hour     = dayjs().hour()
  const eveningDate = hour < 17 ? today : tomorrow
  const eveningTitle =
  hour < 17
    ? "Evening Log (Yesterday’s Workout & Macros)"
    : "Evening Log (Today’s Workout & Macros)"

  const { data: todayLog }    = useDailyLog(today)
  const { data: eveningLog } = useDailyLog(eveningDate)
  const { data: yesterdayLog}= useDailyLog(yesterday)

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
    queryKey: ['recovery', today],
    queryFn: () => getRecovery({ user_id: profile!.id, date: today }),
    enabled: profile?.id != null && hasMorning,
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
  const showMorningData   = hour < 17

  function handleMorningClick() {
    if (!disableMorningCard) setModalDate(today)
  }

  return (
    <AppNav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Welcome banner */}
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

        {/* Check‑in cards */}
        <section aria-label="Daily logs" className="grid sm:grid-cols-2 gap-6">
          <CheckinCard
            type="evening"
            title={eveningTitle}
            completed={hasEvening}
            onClick={() => setModalDate(eveningDate)}
            sections={[
              {
                title: 'Workout Log',
                fields: [
                  { label: 'Trained',       value: eveningLog?.trained ? 'Yes' : 'No' },
                  { label: 'Session',       value: eveningLog?.split },
                  { label: 'Total Sets',    value: eveningLog?.total_sets },
                  { label: 'Failure Sets',  value: eveningLog?.failure_sets },
                  { label: 'Total RIR',     value: eveningLog?.total_rir },
                  { label: 'Recovery Rating', value: eveningLog?.recovery_rating },
                ],
              },
              {
                title: 'Nutrition',
                fields: [
                  { label: 'Calories',     value: eveningLog?.calories },
                  { label: 'Protein (g)',  value: eveningLog?.macros?.protein },
                  { label: 'Carbs (g)',    value: eveningLog?.macros?.carbs },
                  { label: 'Fat (g)',      value: eveningLog?.macros?.fat },
                ],
              },
            ]}
          />

          <CheckinCard
            type="morning"
            title="Morning Check‑in"
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
                      { label: 'Water Intake (L)',  value: todayLog?.water_intake_l },
                      { label: 'Stress',            value: todayLog?.stress },
                      { label: 'Motivation',        value: todayLog?.motivation },
                      { label: 'Soreness',          value: todayLog?.soreness },
                      { label: 'Sleep Quality',     value: todayLog?.sleep_quality },
                      { label: 'Recovery Rating',   value: todayLog?.recovery_rating },
                    ]
                  : [],
              },
            ]}
          />
        </section>

        {/* Modal */}
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

        {/* Optional digest cards */}
        {hour < 17 && digest && <DigestAlerts alerts={digest.alerts} />}
        {hour < 17 && digest && <DigestTips   tips={digest.micro_tips} />}
      </main>
    </AppNav>
  )
}