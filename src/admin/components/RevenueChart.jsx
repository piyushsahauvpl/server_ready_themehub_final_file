import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ================= DATA ================= */

const DATA = {
  current: [
    { label: "Jan", revenue: 120 },
    { label: "Feb", revenue: 350 },
    { label: "Mar", revenue: 450 },
    { label: "Apr", revenue: 120 },
    { label: "May", revenue: 200 },
    { label: "Jun", revenue: 180 },
    { label: "Jul", revenue: 300 },
    { label: "Aug", revenue: 120 },
    { label: "Sep", revenue: 250 },
    { label: "Oct", revenue: 350 },
    { label: "Nov", revenue: 250 },
    { label: "Dec", revenue: 180 },
  ],
  last: [
    { label: "Jan", revenue: 100 },
    { label: "Feb", revenue: 280 },
    { label: "Mar", revenue: 400 },
    { label: "Apr", revenue: 140 },
    { label: "May", revenue: 170 },
    { label: "Jun", revenue: 160 },
    { label: "Jul", revenue: 260 },
    { label: "Aug", revenue: 140 },
    { label: "Sep", revenue: 210 },
    { label: "Oct", revenue: 300 },
    { label: "Nov", revenue: 230 },
    { label: "Dec", revenue: 160 },
  ],
};

const TOTALS = {
  current: "₹256,054.50",
  last: "₹212,430.00",
};

/* ================= COMPONENT ================= */

export default function RevenueChart({ data = [] }) {
  const [range, setRange] = useState("current");
  
  // Transform API data to chart format
  const chartData = data && data.length > 0 ? data.map(item => ({
    label: item.month,
    revenue: item.amount || 0
  })) : [];
  
  const currentData = chartData.length > 0 ? chartData : (range === "current" ? DATA.current : DATA.last);
  const totalRevenue = chartData.length > 0 
    ? chartData.reduce((sum, item) => sum + (item.revenue || 0), 0)
    : (range === "current" ? 256054.50 : 212430.00);
  const formattedTotal = totalRevenue > 0 
    ? `₹${totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` 
    : (range === "current" ? TOTALS.current.replace('$', '₹') : TOTALS.last.replace('$', '₹'));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">

      {/* HEADER */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500">Revenue</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">
            {formattedTotal}
          </h2>
          {chartData.length > 0 && (() => {
            const lastTwo = chartData.slice(-2);
            if (lastTwo.length === 2) {
              const growth = ((lastTwo[1].revenue - lastTwo[0].revenue) / lastTwo[0].revenue * 100).toFixed(1);
              return (
                <p className="text-xs text-green-600 mt-1">
                  {growth >= 0 ? '+' : ''}{growth}% <span className="text-gray-400">vs last month</span>
                </p>
              );
            }
            return (
              <p className="text-xs text-gray-400 mt-1">Data available</p>
            );
          })()}
        </div>

        {/* RANGE SWITCH */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 text-xs">
          <button
            onClick={() => setRange("current")}
            className={`px-3 py-1 rounded-md transition ${
              range === "current"
                ? "bg-white shadow text-gray-900"
                : "text-gray-500 hover:bg-white"
            }`}
          >
            Current Month
          </button>

          <button
            onClick={() => setRange("last")}
            className={`px-3 py-1 rounded-md transition ${
              range === "last"
                ? "bg-white shadow text-gray-900"
                : "text-gray-500 hover:bg-white"
            }`}
          >
            Last Month
          </button>
        </div>
      </div>

      {/* CHART */}
      <ResponsiveContainer width="100%" height={230}>
        <BarChart 
          data={currentData} 
          barSize={18}
          onClick={(data) => {
            if (data && data.activePayload && data.activePayload[0]) {
              const payload = data.activePayload[0].payload;
              alert(`Month: ${payload.label}\nRevenue: ₹${payload.revenue.toLocaleString()}`);
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <defs>
            <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity={1} />
              <stop offset="100%" stopColor="#16A34A" stopOpacity={0.85} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#6B7280" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            tickFormatter={(value) => `₹${value}`}
          />
          <Tooltip
            cursor={{ fill: "rgba(16,185,129,0.08)" }}
            contentStyle={{
              borderRadius: 12,
              border: "none",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              fontSize: 12,
            }}
            formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
          />

          <Bar
            dataKey="revenue"
            fill="url(#greenGradient)"
            radius={[6, 6, 0, 0]}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>

    </div>
  );
}
