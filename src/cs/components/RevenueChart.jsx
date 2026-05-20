import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const data = [
  { name: "Jan", profit: 50, revenue: 80 },
  { name: "Feb", profit: 70, revenue: 100 },
  { name: "Mar", profit: 90, revenue: 120 },
  { name: "Apr", profit: 100, revenue: 150 }
];

export default function RevenueChart() {
  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h3 className="font-bold text-gray-800 mb-3">Revenue</h3>

      <AreaChart width={500} height={250} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Legend />

        <Area type="monotone" dataKey="profit" fill="#60A5FA" stroke="#60A5FA" name="Profit" />
        <Area type="monotone" dataKey="revenue" fill="#FACC15" stroke="#FACC15" name="Revenue" />
      </AreaChart>
    </div>
  );
}
