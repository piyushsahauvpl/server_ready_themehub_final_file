import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const defaultData = [
  { name: "Admin", sales: 420 },
  { name: "E-Commerce", sales: 310 },
  { name: "Landing", sales: 180 },
];

export default function TopCategoriesChart({ data = [] }) {
  const chartData = data.length > 0 ? data.map(item => ({
    name: item.name,
    sales: item.count
  })) : defaultData;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Top Selling Categories
        </h3>
        <span className="text-xs text-emerald-600 font-medium">
          This Month
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart 
          data={chartData} 
          barSize={22}
          onClick={(data) => {
            if (data && data.activePayload && data.activePayload[0]) {
              const payload = data.activePayload[0].payload;
              alert(`Category: ${payload.name}\nSales: ${payload.sales} templates`);
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#6B7280",
              fontSize: 12,
              fontWeight: 500,
            }}
          />

          <Tooltip
            cursor={{ fill: "rgba(16,185,129,0.08)" }}
            contentStyle={{
              borderRadius: 12,
              border: "none",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              fontSize: 12,
            }}
            formatter={(value) => [value, 'Sales']}
          />

          <Bar
            dataKey="sales"
            radius={[8, 8, 0, 0]}
            fill="#22C55E"
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Footer Insight */}
      <p className="mt-4 text-xs text-gray-500">
        Highest demand templates based on recent orders
      </p>

    </div>
  );
}
