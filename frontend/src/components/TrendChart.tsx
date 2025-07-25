// src/components/TrendChart.tsx
import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

type ChartType = 'line' | 'bar' | 'radar';

interface LineData {
  label: string;
  recovery: number;
  sleep: number;
  rhr: number;
}

interface BarData {
  label: string;
  volume: number;
  failures: number;
}

interface RadarData {
  metric: string;
  goal: number;
  actual: number;
}

interface TrendChartProps {
  chart: ChartType;
  data: LineData[] | BarData[] | RadarData[];
}

export default function TrendChart({ chart, data }: TrendChartProps) {
  if (chart === 'line') {
    const lineData = data as LineData[];
    return (
      <div>
        <h3 className="text-sm font-medium mb-2">Recovery vs Sleep vs HRV</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={lineData}
            margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
            />
            <XAxis
              dataKey="label"
              stroke="var(--text-muted)"
            />
            <YAxis
              stroke="var(--text-muted)"
            />
            <Tooltip
              formatter={(value: number, name: string) => [value.toFixed(1), name]}
              labelFormatter={label => `Metric: ${label}`}
            />
            {/* Legend moved underneath, centered */}
            <Legend
              verticalAlign="bottom"
              align="center"
              layout="horizontal"
            />
            <Line type="monotone" dataKey="recovery" name="Recovery" stroke="#F87171" />
            <Line type="monotone" dataKey="sleep"    name="Sleep (h)"  stroke="#34D399" />
            <Line type="monotone" dataKey="rhr" name="rHR Δ%" stroke="#38BDF8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart === 'bar') {
    const barData = data as BarData[];
    return (
      <div>
        <h3 className="text-sm font-medium mb-2">Training Volume vs Failures</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={barData}
            margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip
             formatter={(v: number, n: string) => [v.toFixed(1), n]}
             labelFormatter={l => `Metric: ${l}`}
             wrapperStyle={{
               background: 'var(--surface)',
               border:     '1px solid var(--border)',
               borderRadius: 8,
               boxShadow:   '0 4px 12px rgba(0,0,0,.25)',
               color:       'var(--text-primary)',
             }}
             labelStyle={{ color:'var(--text-muted)', fontWeight:600 }}
           />
            {/* Legend moved underneath, centered */}
            <Legend
              verticalAlign="bottom"
              align="center"
              layout="horizontal"
            />
            <Bar dataKey="volume"   name="Volume"   fill="#4F46E5" />
            <Bar dataKey="failures" name="Failures" fill="#FBBF24" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // radar
  const radarData = data as RadarData[];
  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Macro Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart
          data={radarData}
          outerRadius="80%"
          margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
        >
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" />
          <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tickCount={3} />
          <Radar name="Goal"   dataKey="goal"   stroke="#F87171" fill="#F87171" fillOpacity={0.2}/>
          <Radar name="Actual" dataKey="actual" stroke="#10B981" fill="#10B981" fillOpacity={0.2}/>
          {/* already centered underneath */}
          <Legend
            verticalAlign="bottom"
            align="center"
            layout="horizontal"
            wrapperStyle={{ bottom: 0 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}