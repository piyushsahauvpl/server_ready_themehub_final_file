import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const defaultData = [
  { month: "Jan", users: 400 },
  { month: "Feb", users: 650 },
  { month: "Mar", users: 900 },
  { month: "Apr", users: 1200 },
];

export default function CustomerChart({ data = [] }) {
  const chartData = data.length > 0 ? data.map(item => ({
    month: item.month,
    users: item.count
  })) : defaultData;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        Customer Growth
      </h3>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart 
          data={chartData}
          onClick={(data) => {
            if (data && data.activePayload && data.activePayload[0]) {
              const payload = data.activePayload[0].payload;
              alert(`Month: ${payload.month}\nNew Users: ${payload.users}`);
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <defs>
            <linearGradient id="users" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12, fill: "#6B7280" }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: "#9CA3AF" }}
          />
          <Tooltip 
            formatter={(value) => [value, 'New Users']}
            contentStyle={{
              borderRadius: 8,
              border: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          />
          <Area
            type="monotone"
            dataKey="users"
            stroke="#16A34A"
            fill="url(#users)"
            strokeWidth={2}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
