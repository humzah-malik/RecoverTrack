// src/pages/Trends.tsx
import React, { useState } from 'react';
import dayjs from 'dayjs';
import { groupBy } from 'lodash';
import TrendsHeader from '../components/TrendsHeader';
import TrendChart from '../components/TrendChart';
import { useTrendsData } from '../hooks/useTrendsData';
import { useInsights } from '../hooks/useInsights';

export default function Trends() {
  // 1️⃣ week vs month toggle
  const [view, setView] = useState<'week' | 'month'>('month');

  // 2️⃣ sliding window
  const [cursor, setCursor] = useState(
    dayjs().startOf(view === 'week' ? 'week' : 'month')
  );
  const prev = () =>
    setCursor(c =>
      view === 'week'
        ? c.subtract(1, 'week').startOf('week')
        : c.subtract(1, 'month').startOf('month')
    );
  const next = () =>
    setCursor(c =>
      view === 'week'
        ? c.add(1, 'week').startOf('week')
        : c.add(1, 'month').startOf('month')
    );

  // 3️⃣ period string (just for header wording)
  const period = view === 'week' ? '7d' : '30d';

  // 4️⃣ fetch from backend
  const { logs, recs, isLoading, error } = useTrendsData(view, cursor);
  console.log('📊 logs:', logs);
  console.log('📈 recs:', recs);

  // ────────────────────────────────────────────────────────────────────
  // 5️⃣ Compute header stats
  const scores = recs.map(r => r.score);
  const average = scores.reduce((a,b) => a+b, 0) / scores.length || 0;
  const sd = Math.sqrt(
    scores.reduce((sum, s) => sum + Math.pow(s - average, 2), 0) / scores.length
  ) || 0;

  const sleepHrs = logs
    .filter(l => l.sleep_h != null)
    .reduce((a,l) => a + l.sleep_h, 0) / logs.length || 0;

  const workouts = logs.filter(l => l.trained === 1).length;

  // average macro adherence across days: mean( (p/pT + c/cT + f/fT)/3 ) * 100
  const macroAdherence =
    logs
      .map(l => (l.protein/l.proteinTarget + l.carbs/l.carbsTarget + l.fat/l.fatTarget) / 3)
      .filter(x => !isNaN(x))
      .reduce((a,b) => a+b, 0) / logs.length * 100 || 0;

      const statsForHeader = {
            average,
            sd,
            sleep: sleepHrs,
            workouts,
            macroAdherence,
          };
        
          // context sent to the rule engine
          const ruleCtx = {
            ...statsForHeader,
            macro_compliance_pct: macroAdherence,
            weekly_sessions: workouts,
          };
        
          console.log('🧠 Rule context:', ruleCtx);
        
          const { data: insights = [], isLoading: insightsLoading } = useInsights(view, ruleCtx);

  if (isLoading) return <div>Loading…</div>;
  if (error)     return <div>Error loading data</div>;

  // ────────────────────────────────────────────────────────────────────
  // 6️⃣ Bucket logs & recs by label (day-of-week or week-of-month)
  const bucketLogs = logs.map(l => ({
    ...l,
    bucket: view === 'week'
      ? dayjs(l.date).format('ddd')
      : `Week ${Math.ceil(dayjs(l.date).date()/7)}`
  }));
  const bucketRecs = recs.map(r => ({
    ...r,
    bucket: view === 'week'
      ? dayjs(r.date).format('ddd')
      : `Week ${Math.ceil(dayjs(r.date).date()/7)}`
  }));

  const logsByBucket = groupBy(bucketLogs, 'bucket');
  const recsByBucket = groupBy(bucketRecs, 'bucket');
  const buckets = Object.keys(logsByBucket).sort(
    a => view === 'week' ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].indexOf(a) : 0
  );

  // 7️⃣ Build chartData array
  const chartData = buckets.map(bucket => {
    //console.log('🧮 chartData:', chartData);
    const days = logsByBucket[bucket];
    const preds = recsByBucket[bucket] || [];

    const recovery = preds.length
      ? preds.reduce((a,b) => a + b.score, 0)/preds.length
      : 0;

    const sleep = days.reduce((a,d) => a + d.sleep_h, 0)/days.length || 0;
    const hrv   = days.reduce((a,d) => a + d.hrv, 0)/days.length || 0;
    const volume   = days.reduce((a,d) => a + d.volume, 0);
    const failures = days.reduce((a,d) => a + d.failures, 0);

    return { label: bucket, recovery, sleep, hrv, volume, failures };
  });

  // ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* header with nav, toggle, and metrics */}
      <TrendsHeader
        view={view}
        setView={setView}
        cursor={cursor}
        onPrev={prev}
        onNext={next}
        stats={statsForHeader}
      />

      {/* 2×2 grid of charts + insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recovery vs Sleep vs HRV */}
        <div className="bg-white border border-gray-200 shadow-sm p-4 rounded-lg">
          <TrendChart
            chart="line"
            data={chartData.map(d => ({
              label: d.label,
              recovery: d.recovery,
              sleep: d.sleep,
              hrv: d.hrv
            }))}
          />
        </div>

        {/* Training Volume vs Failures */}
        <div className="bg-white border border-gray-200 shadow-sm p-4 rounded-lg">
          <TrendChart
            chart="bar"
            data={chartData.map(d => ({
              label: d.label,
              volume: d.volume,
              failures: d.failures
            }))}
          />
        </div>

        {/* Macro Distribution (sum actual vs targets over the period) */}
        <div className="bg-white border border-gray-200 shadow-sm p-4 rounded-lg">
          <TrendChart
            chart="radar"
            data={[
              { metric: 'Protein', goal: logs.reduce((a,l)=>a+l.proteinTarget,0), actual: logs.reduce((a,l)=>a+l.protein,0) },
              { metric: 'Carbs',   goal: logs.reduce((a,l)=>a+l.carbsTarget,0),   actual: logs.reduce((a,l)=>a+l.carbs,0)   },
              { metric: 'Fat',     goal: logs.reduce((a,l)=>a+l.fatTarget,0),    actual: logs.reduce((a,l)=>a+l.fat,0)     },
            ]}
          />
        </div>

        {/* Insights */}
        <div className="bg-white border border-gray-200 shadow-sm p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Insights</h2>
          {insightsLoading ? (
            <p className="text-sm text-gray-500">Loading insights...</p>
          ) : insights.length === 0 ? (
            <p className="text-sm text-gray-500">No insights for this period.</p>
          ) : (
            <ul className="list-disc list-inside text-sm space-y-1">
              {insights.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}