// src/components/DailyAccordion.tsx
import React, { useState, useEffect } from 'react'
import { useSplitSessions } from '../hooks/useSplitSessions'
import { Disclosure } from '@headlessui/react'
import { useDailyLog, useUpsertDailyLog } from './DailyLog'
import { useProfile } from '../hooks/useProfile'

interface Props {
  date: string
  type: 'morning' | 'evening'
  label: string
  onSave?: () => void
}

export default function DailyAccordion({ date, type, label, onSave }: Props) {
  /* ── data + mutation ───────────────────────────────────────────── */
  const { data, isLoading } = useDailyLog(date)
  const upsert = useUpsertDailyLog()
  const { data: sessions = [] } = useSplitSessions()
  const { profile } = useProfile()
  console.log('[DailyAccordion] sessions for dropdown:', sessions)

  /* ── form state (blank defaults) ───────────────────────────────── */
  const emptyState = {
    /* morning */
    sleep_start: '', sleep_end: '', sleep_quality: '',
    resting_hr:  '', hrv: '', soreness: '', stress: '',
    motivation: '',                    // NEW
    recovery_rating: '',               // NEW (optional, morning)

    /* evening */
    trained: false,
    total_sets: '', failure_sets: '', total_rir: '',
    calories: '', water_intake_l: '', // NEW (evening)
    protein: '', carbs: '', fat: '',  // NEW (macros)

    // If you later reinstate split, leave it blank here
    split: '',
  }
  const [form, setForm] = useState(emptyState)

  /* ── hydrate form when data arrives ────────────────────────────── */
  useEffect(() => {
    if (!data) return
    setForm({
      sleep_start:    data.sleep_start    ?? '',
      sleep_end:      data.sleep_end      ?? '',
      sleep_quality:  data.sleep_quality  != null ? String(data.sleep_quality) : '',
      resting_hr:     data.resting_hr     != null ? String(data.resting_hr)    : '',
      hrv:            data.hrv            != null ? String(data.hrv)           : '',
      soreness:       data.soreness       != null ? String(data.soreness)      : '',
      stress:         data.stress         != null ? String(data.stress)        : '',
      motivation:     data.motivation     != null ? String(data.motivation)    : '',
      recovery_rating:data.recovery_rating!= null ? String(data.recovery_rating): '',

      trained:        Boolean(data.trained),
      total_sets:     data.total_sets     != null ? String(data.total_sets)    : '',
      failure_sets:   data.failure_sets   != null ? String(data.failure_sets)  : '',
      total_rir:      data.total_rir      != null ? String(data.total_rir)     : '',
      calories:       data.calories       != null ? String(data.calories)      : '',
      water_intake_l: data.water_intake_l != null ? String(data.water_intake_l): '',

      protein: data.macros?.protein != null ? String(data.macros.protein) : '',
      carbs:   data.macros?.carbs   != null ? String(data.macros.carbs)   : '',
      fat:     data.macros?.fat     != null ? String(data.macros.fat)     : '',
      split:   data.split ?? '',
    })
  }, [data])

  /* ── generic field handler ─────────────────────────────────────── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type: t, checked } = e.target
    setForm(prev => ({ ...prev, [name]: t === 'checkbox' ? checked : value }))
  }

  /* ── save to backend ───────────────────────────────────────────── */
  const handleSave = async () => {
    const payload: any = { date }

    /** helper → push only if value !== ''  */
    const add = (k: string, raw: string | boolean, numeric = false) => {
      if (raw === '' || raw === null || raw === undefined) return
      payload[k] = numeric ? Number(raw) : raw
    }

    if (type === 'morning') {
      add('sleep_start',   form.sleep_start)
      add('sleep_end',     form.sleep_end)
      add('sleep_quality', form.sleep_quality, true)
      add('resting_hr',    form.resting_hr,    true)
      add('hrv',           form.hrv,           true)
      add('soreness',      form.soreness,      true)
      add('stress',        form.stress,        true)
      add('motivation',    form.motivation,    true)
      add('recovery_rating', form.recovery_rating, true) // optional
    } else {
      if (profile?.split_template_id) {
        payload.split_template_id = profile.split_template_id
      }
      payload.trained = form.trained
      add('split', form.split)
      add('total_sets',    form.total_sets,    true)
      add('failure_sets',  form.failure_sets,  true)
      add('total_rir',     form.total_rir,     true)
      add('calories',      form.calories,      true)
      add('water_intake_l',form.water_intake_l,true)

      /* build macros JSON only if any value present */
      if (form.protein || form.carbs || form.fat) {
        payload.macros = {
          ...(form.protein && { protein: Number(form.protein) }),
          ...(form.carbs   && { carbs:   Number(form.carbs)   }),
          ...(form.fat     && { fat:     Number(form.fat)     }),
        }
      }
    }

    console.log('Final payload being sent:', JSON.stringify(payload, null, 2))

    try {
      await upsert.mutateAsync(payload)
      onSave?.()
      console.log('[DailyAccordion] upsert succeeded')
    } catch (err: any) {
      console.error('[DailyAccordion] upsert failed:', err.response?.data || err.message)
      alert(`Save failed: ${err.response?.data?.detail || err.message}`)
    }
  }

  /* ── field configs for UI ──────────────────────────────────────── */
  const morningFields = [
    { name: 'sleep_start',   label: 'Sleep Start (HH:MM)' },
    { name: 'sleep_end',     label: 'Sleep End (HH:MM)'   },
    { name: 'sleep_quality', label: 'Sleep Quality (1–5)' },
    { name: 'resting_hr',    label: 'Resting HR'          },
    { name: 'hrv',           label: 'HRV'                 },
    { name: 'soreness',      label: 'Soreness (1–5)'      },
    { name: 'stress',        label: 'Stress (1–5)'        },
    { name: 'motivation',    label: 'Motivation (1–5)'    },          // NEW
    { name: 'recovery_rating', label: 'Recovery Rating (0–100, optional)' }, // NEW
  ]

  const eveningFields = [
    { name: 'trained',      label: 'Did you train?', type: 'checkbox' },
    { name: 'split',        label: 'Session', type: 'select' },
    { name: 'total_sets',   label: 'Total Sets'      },
    { name: 'failure_sets', label: 'Failure Sets'    },
    { name: 'total_rir',    label: 'Total RIR'       },
    { name: 'calories',     label: 'Calories'        },
    { name: 'protein',      label: 'Protein (g)'     }, // macros
    { name: 'carbs',        label: 'Carbs (g)'       },
    { name: 'fat',          label: 'Fat (g)'         },
    { name: 'water_intake_l', label: 'Water (L)'     },
  ]

  const fields = type === 'morning' ? morningFields : eveningFields

  /* ── render ────────────────────────────────────────────────────── */
  return (
    <Disclosure>
      <Disclosure.Button
        className="w-full bg-white text-left px-4 py-3 border border-gray-200 rounded-lg font-semibold shadow-sm"
      >
        {label}
      </Disclosure.Button>

      <Disclosure.Panel className="p-4 bg-white border-t-0 border-gray-200 rounded-b-lg space-y-3">
        {isLoading ? (
          <p>Loading…</p>
        ) : (
          <form className="space-y-3">
            {fields.map(f => (
              <div key={f.name} className="flex flex-col">
                <label className="text-xs font-medium text-gray-600">{f.label}</label>

                {f.type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    name={f.name}
                    checked={form[f.name] as boolean}
                    onChange={handleChange}
                  />
                ) : f.type === 'select' ? (
                                    <select
                                      name={f.name}
                                      value={form[f.name] as string}
                                      onChange={handleChange}
                                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    >
                                      <option value="">– choose –</option>
                                      {sessions.map(s => (
                                        <option key={s.id} value={s.name}>
                             {s.name}
                             </option>
                         ))}
                      </select>
                  ) : (<input
                    type="text"
                    name={f.name}
                    value={form[f.name] as string}
                    onChange={handleChange}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleSave}
              disabled={upsert.isLoading}
              className="bg-black text-white px-4 py-2 text-sm font-semibold rounded"
            >
              {upsert.isLoading ? 'Saving…' : 'Save Check-In'}
            </button>
          </form>
        )}
      </Disclosure.Panel>
    </Disclosure>
  )
}