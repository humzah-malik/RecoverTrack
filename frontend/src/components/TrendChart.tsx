// src/components/TrendChart.tsx
import React from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

type ChartType = 'line' | 'bar' | 'radar';

interface LineData {
  label: string;
  recovery: number;
  sleep: number;
  hrv: number;
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
        <LineChart width={500} height={250} data={lineData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip
            formatter={(value: number, name: string) => [value.toFixed(1), name]}
            labelFormatter={(label) => `Metric: ${label}`}
          />
          <Legend />
          <Line type="monotone" dataKey="recovery" name="Recovery" stroke="#F87171" />
          <Line type="monotone" dataKey="sleep"    name="Sleep (h)" stroke="#34D399" />
          <Line type="monotone" dataKey="hrv"      name="HRV"       stroke="#111827" />
        </LineChart>
      </div>
    );
  }

  if (chart === 'bar') {
    const barData = data as BarData[];
    return (
      <div>
        <h3 className="text-sm font-medium mb-2">Training Volume vs Failures</h3>
        <BarChart width={500} height={250} data={barData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip 
            formatter={(value: number, name: string) => [`${value}`, name]} 
            labelFormatter={(label) => `Metric: ${label}`} 
          />
          <Legend />
          <Bar dataKey="volume"   name="Volume"   fill="#4F46E5" />
          <Bar dataKey="failures" name="Failures" fill="#FBBF24" />
        </BarChart>
      </div>
    );
  }

  // chart === 'radar'
  const radarData = data as RadarData[];
  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Macro Distribution</h3>
      <div className="flex justify-center">
        <RadarChart outerRadius={80} width={350} height={300} data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" />
          <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} />
          <Radar name="Goal"   dataKey="goal"   stroke="#F87171" fill="#F87171" fillOpacity={0.2} />
          <Radar name="Actual" dataKey="actual" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
          <Legend />
        </RadarChart>
      </div>
    </div>
  );
}