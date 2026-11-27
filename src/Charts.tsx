import { useState } from "react";
import {
  AreaChart,
  Area,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { demandSeries, fmt, type Metric, sum } from "./model";
const axis = { fontSize: 12, fill: "#738078" };
export function DemandChart({ date }: { date: string }) {
  const [days, setDays] = useState(7);
  return (
    <section className="card chart-card">
      <div className="card-head">
        <div>
          <h2>Demand trend</h2>
          <p>Actual and forecast meal portions</p>
        </div>
        <select
          aria-label="Demand trend period"
          className="compact"
          value={days}
          onChange={(e) => setDays(+e.target.value)}
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
        </select>
      </div>
      <div className="legend">
        <span>
          <i className="line-key" />
          Actual demand
        </span>
        <span>
          <i className="line-key dashed" />
          Forecast
        </span>
      </div>
      <div
        className="chart"
        role="img"
        aria-label={
          "Historical actual and forecast portions for the last " +
          days +
          " days"
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={demandSeries(date, days)}
            margin={{ top: 8, right: 8, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7cae83" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#7cae83" stopOpacity={0.015} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="#e5ebe6"
              strokeDasharray="3 4"
            />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={axis}
              minTickGap={14}
              dy={8}
            />
            <YAxis
              domain={["dataMin - 30", "dataMax + 20"]}
              tickCount={5}
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={axis}
            />
            <Tooltip />
            <Area
              type="monotone"
              name="Actual demand"
              dataKey="actual"
              stroke="#2f7952"
              strokeWidth={3}
              fill="url(#area)"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              name="Forecast"
              dataKey="forecast"
              stroke="#b29951"
              strokeWidth={2.5}
              strokeDasharray="6 5"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
export function WasteChart({ rows }: { rows: Metric[] }) {
  const dates = [...new Set(rows.map((r) => r.date))];
  const data = dates.map((d) => ({
    day: fmt(d, { day: "numeric", month: "short" }),
    kg: +sum(rows.filter((r) => r.date === d).map((r) => r.weight)).toFixed(2),
  }));
  return (
    <section className="card chart-card">
      <div className="card-head">
        <div>
          <h2>Waste over time</h2>
          <p>Recorded food waste in kilograms</p>
        </div>
      </div>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="#e2e8e1"
              strokeDasharray="3 4"
            />
            <XAxis
              dataKey="day"
              tick={axis}
              axisLine={false}
              tickLine={false}
              minTickGap={22}
            />
            <YAxis tick={axis} axisLine={false} tickLine={false} />
            <Tooltip />
            <Area
              name="Waste (kg)"
              type="monotone"
              dataKey="kg"
              fill="#dcebe0"
              stroke="#387e58"
              strokeWidth={3}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
