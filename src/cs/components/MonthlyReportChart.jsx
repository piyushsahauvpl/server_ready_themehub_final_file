import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
 
const data = [
  { name: "Jan", sales: 4000, expenses: 2400, profit: 1600, revenue: 3200 },
  { name: "Feb", sales: 3000, expenses: 1398, profit: 1602, revenue: 2800 },
  { name: "Mar", sales: 2000, expenses: 9800, profit: 7800, revenue: 2200 },
  { name: "Apr", sales: 2780, expenses: 3908, profit: 1118, revenue: 2600 },
  { name: "May", sales: 1890, expenses: 4800, profit: 2910, revenue: 2400 },
  { name: "Jun", sales: 2390, expenses: 3800, profit: 1410, revenue: 2100 },
  { name: "Jul", sales: 3490, expenses: 4300, profit: 810, revenue: 2900 },
  { name: "Aug", sales: 4000, expenses: 2400, profit: 1600, revenue: 3200 },
  { name: "Sep", sales: 3000, expenses: 1398, profit: 1602, revenue: 2800 },
  { name: "Oct", sales: 2000, expenses: 9800, profit: 7800, revenue: 2200 },
  { name: "Nov", sales: 2780, expenses: 3908, profit: 1118, revenue: 2600 },
  { name: "Dec", sales: 1890, expenses: 4800, profit: 2910, revenue: 2400 },
];
 
export default function MonthlyReportChart() {
  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h3 className="font-bold text-gray-800 mb-3">Monthly Report</h3>
      <BarChart width={600} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="sales" fill="#FF0000" name="Sales" /> {/* Red */}
        <Bar dataKey="expenses" fill="#0000FF" name="Expenses" /> {/* Blue */}
        <Bar dataKey="profit" fill="#00FF00" name="Profit" /> {/* Green */}
        <Bar dataKey="revenue" fill="#FFFF00" name="Revenue" /> {/* Yellow */}
      </BarChart>
    </div>
  );
}
