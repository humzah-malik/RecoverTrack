import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useDailyLog, useUpsertDailyLog } from './DailyLog';
import { useSplitSessions } from '../hooks/useSplitSessions';
import { useProfile } from '../hooks/useProfile';
import { useQueryClient } from '@tanstack/react-query';
import RangeField from '../components/RangeField'
console.log('Dialog=', Dialog, 'Transition=', Transition)
console.log('useDailyLog=', useDailyLog, 'useUpsertDailyLog=', useUpsertDailyLog)
import { toast } from 'react-hot-toast';
import React from 'react'
import dayjs from 'dayjs';

interface Props {
  date: string;
  isOpen: boolean;
  onClose: () => void;
  disableMorningFields?: boolean;
}

export default function DailyLogModal({ date, isOpen, onClose }: Props) {
  const { data, isLoading } = useDailyLog(date);
  const upsert = useUpsertDailyLog();
  const { data: sessions = [] } = useSplitSessions();
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tomorrowStr  = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const currentHour = dayjs().hour();
  // lock morning inputs for *tomorrow’s* date, but only after 17:00
  const disableMorning = (date === tomorrowStr) && (currentHour >= 17);

  const [form, setForm] = useState({
    sleepStart: '23:30',
    sleepEnd: '07:00',
    restingHr: '',
    hrv: '',
    water: '',
    stress: 1,
    motivation: 1,
    soreness: 1,
    trained: false,
    split: '',
    totalSets: '',
    failureSets: '',
    totalRir: '',
    calories: '',
    weight: '',
    protein: '',
    carbs: '',
    fat: '',
    recoveryRating: '',
    sleepQuality: 1,
  });

  useEffect(() => {
    if (data) {
      setForm({
        sleepStart: data.sleep_start || '',
        sleepEnd: data.sleep_end || '',
        restingHr: data.resting_hr?.toString() || '',
        hrv: data.hrv?.toString() || '',
        water: data.water_intake_l?.toString() || '',
        stress: data.stress || 0,
        motivation: data.motivation || 0,
        soreness: data.soreness || 0,
        sleepQuality: data.sleep_quality || 0,
        trained: !!data.trained,
        split: data.split || '',
        totalSets: data.total_sets?.toString() || '',
        failureSets: data.failure_sets?.toString() || '',
        totalRir: data.total_rir?.toString() || '',
        calories: data.calories?.toString() || '',
        weight: data.weight?.toString() || '',
        protein: data.macros?.protein?.toString() || '',
        carbs: data.macros?.carbs?.toString() || '',
        fat: data.macros?.fat?.toString() || '',
        recoveryRating: data.recovery_rating?.toString() || '',
      });
    }
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    let v: string | boolean | number;
  
    if (disableMorning) {
      const morningFields = [
        'sleepStart', 'sleepEnd', 'restingHr', 'hrv', 'water',
        'stress', 'motivation', 'soreness', 'sleepQuality'
      ];
      if (morningFields.includes(name)) return;
    }
  
    if (type === 'checkbox') v = checked;
    else if (type === 'range') v = Number(value);
    else v = value;
  
    setForm(prev => ({ ...prev, [name]: v }));
  };

  const handleSave = () => {
      // build only the keys the user actually set
      const payload: any = { date };
    
      const add = (k: string, raw: any, numeric = false) => {
        if (raw === '' || raw == null) return;
        payload[k] = numeric ? Number(raw) : raw;
      };
      add('sleep_start',   form.sleepStart)
      add('sleep_end',     form.sleepEnd)
    
      // morning fields
      add('sleep_quality', form.sleepQuality, true);
      add('resting_hr',    form.restingHr,    true);
      add('hrv',           form.hrv,           true);
      add('soreness',      form.soreness,      true);
      add('stress',        form.stress,        true);
      add('motivation',    form.motivation,    true);
      add('recovery_rating', form.recoveryRating, true);
    
      // evening fields
      if (profile?.split_template_id) {
        payload.split_template_id = profile.split_template_id;
        payload.trained = form.trained;
        add('split',        form.split);
        add('total_sets',   form.totalSets,    true);
        add('failure_sets', form.failureSets,  true);
        add('total_rir',    form.totalRir,     true);
        add('calories',     form.calories,     true);
        add('water_intake_l', form.water,      true);
    
        // only send macros if any one is set
        if (form.protein || form.carbs || form.fat) {
          payload.macros = {
            ...(form.protein && { protein: form.protein }),
            ...(form.carbs   && { carbs:   form.carbs   }),
            ...(form.fat     && { fat:     form.fat     }),
          };
        }
      }
    
      console.log('Saving payload', payload);
    
      upsert.mutate(payload, {
        onSuccess: () => {
          toast.success('Log saved');
          onClose();
          queryClient.invalidateQueries({ queryKey: ['logs'] })
          queryClient.invalidateQueries({ queryKey: ['recs'] })
        },
        onError: (err: any) => {
          console.error(err.response?.data);
          toast.error(err.response?.data?.detail || 'Failed to save');
        },
      });
    };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" />
          </Transition.Child>

          <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transform bg-white shadow-md rounded-xl">
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">  
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900">Recovery Log</h2>
                  <p className="text-sm text-gray-500">{date}</p>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-black">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="max-h-[70vh] overflow-y-auto px-6 py-6 space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className={disableMorning ? 'opacity-50 pointer-events-none' : ''}>
                <Section title="Sleep & Wellness">
                  {/* first: times + water in 2 cols */}
                  <div className="grid grid-cols-2 gap-6">
                    <Field
                      label="Sleep Start"
                      type="time"
                      name="sleepStart"
                      value={form.sleepStart}
                      onChange={handleChange}
                      disabled={disableMorning}
                    />
                    <Field
                      label="Sleep End"
                      type="time"
                      name="sleepEnd"
                      value={form.sleepEnd}
                      onChange={handleChange}
                      disabled={disableMorning}
                    />
                    <Field
                      label="Resting HR"
                      name="restingHr"
                      value={form.restingHr}
                      onChange={handleChange}
                      disabled={disableMorning}
                    />
                    <Field
                      label="HRV"
                      name="hrv"
                      value={form.hrv}
                      onChange={handleChange}
                      disabled={disableMorning}
                    />
                    <Field
                      label="Water Intake (L)"
                      name="water"
                      value={form.water}
                      onChange={handleChange}
                      disabled={disableMorning}
                    />
                  </div>

                  {/* then: sliders stacked in one column */}
                  <div className="mt-6 space-y-4 w-full">
                    <RangeField
                      label="Stress (1–5)"
                      name="stress"
                      value={form.stress}
                      onChange={val => {
                        if (!disableMorning) setForm(f => ({ ...f, stress: val }));
                      }}
                      min={1} max={5} step={1}
                      disabled={disableMorning}
                    />
                    <RangeField
                      label="Motivation (1–5)"
                      name="motivation"
                      value={form.motivation}
                      onChange={val => {
                        if (!disableMorning) setForm(f => ({ ...f, motivation: val }));
                      }}
                      min={1} max={5} step={1}
                      disabled={disableMorning}
                    />
                    <RangeField
                      label="Soreness (1–5)"
                      name="soreness"
                      value={form.soreness}
                      onChange={val => {
                        if (!disableMorning) setForm(f => ({ ...f, soreness: val }));
                      }}
                      min={1} max={5} step={1}
                      disabled={disableMorning}
                    />
                    <RangeField
                      label="Sleep Quality (1–5)"
                      name="sleepQuality"
                      value={form.sleepQuality}
                      onChange={val => {
                        if (!disableMorning) setForm(f => ({ ...f, sleepQuality: val }));
                      }}
                      min={1} max={5} step={1}
                      disabled={disableMorning}
                    />
                  </div>
                </Section>
                </div>
              </div>  

              <div className="bg-white border border-gray-200 rounded-lg p-6">
              <Section title="Workout Log">
                {/* toggle + session on separate rows */}
                <div className="flex items-center gap-4">
                  <ToggleField
                    label="Trained Today?"
                    name="trained"
                    checked={form.trained}
                    onChange={handleChange}
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Session
                  </label>
                  <select
                    name="split"
                    value={form.split}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-900 focus:border-gray-400 focus:ring-0"
                  >
                    <option value="">Select session</option>
                    {sessions.map(sess => (
                      <option key={sess.id} value={sess.name}>
                        {sess.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* then metrics in a 2‑col grid */}
                <div className="grid grid-cols-2 gap-6 mt-6">
                  <Field
                    label="Total Sets"
                    name="totalSets"
                    value={form.totalSets}
                    onChange={handleChange}
                  />
                  <Field
                    label="Failure Sets"
                    name="failureSets"
                    value={form.failureSets}
                    onChange={handleChange}
                  />
                  <Field
                    label="Total RIR"
                    name="totalRir"
                    value={form.totalRir}
                    onChange={handleChange}
                  />
                  <Field
                    label="Your Recovery Rating (0–100)"
                    name="recoveryRating"
                    value={form.recoveryRating}
                    onChange={handleChange}
                  />
                </div>
              </Section>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
              <Section title="Nutrition">
                <div className="grid grid-cols-2 gap-6">
                  {/* left column */}
                    <Field label="Calories"    name="calories" value={form.calories} onChange={handleChange} />
                    <Field label="Protein (g)" name="protein"  value={form.protein}  onChange={handleChange} />
                    <Field label="Carbs (g)"   name="carbs"    value={form.carbs}    onChange={handleChange} />
                    <Field label="Fat (g)"     name="fat"      value={form.fat}      onChange={handleChange} />
                  {/* right column: empty */}
                  <div />
                </div>
              </Section>
              </div>  
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t flex justify-end gap-3">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm rounded-md bg-black text-white hover:bg-gray-800"
                >
                  Save Log
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

/* -- Reusable Input Components -- */
function Field({ label, ...props }: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-2">{label}</label>
      <input
        {...props}
        className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-900 focus:border-gray-400 focus:ring-0"
      />
    </div>
  );
}

function ToggleField({ label, name, checked, onChange }: any) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-300 rounded-full peer-focus:ring-4 peer-focus:ring-gray-300 peer-checked:bg-gray-900 transition-colors" />
      <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full peer-checked:translate-x-5 transition-transform" />
      <span className="ml-3 text-sm font-medium text-gray-900 select-none">{label}</span>
    </label>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      {children}
    </div>
  );
}