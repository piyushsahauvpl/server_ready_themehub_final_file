import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const defaultData = [
  { name: "React", value: 55 },
  { name: "HTML/CSS", value: 20 },
  { name: "Angular", value: 15 },
  { name: "Vue", value: 10 },
];

const COLORS = ["#22C55E", "#3B82F6", "#F97316", "#8B5CF6"];

export default function FrameworkDonutChart({ data = [] }) {
  const chartData = data.length > 0 ? data.map(item => ({
    name: item.name,
    value: item.count
  })) : defaultData;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        Popular Frameworks
      </h3>

      <ResponsiveContainer width="100%" height={260}>
        <PieChart
          onClick={(data) => {
            if (data && data.activePayload && data.activePayload[0]) {
              const payload = data.activePayload[0].payload;
              alert(`Framework: ${payload.name}\nCount: ${payload.value} templates`);
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <Pie
            data={chartData}
            innerRadius={65}
            outerRadius={95}
            paddingAngle={5}
            dataKey="value"
            animationDuration={800}
          >
            {chartData.map((_, i) => (
              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name) => [value, 'Templates']}
            contentStyle={{
              borderRadius: 8,
              border: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
