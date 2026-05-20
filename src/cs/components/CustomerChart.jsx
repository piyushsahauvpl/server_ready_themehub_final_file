import {  Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

const data = [
  { name: "Jan", new: 150, returning: 80, total: 230 },
  { name: "Feb", new: 200, returning: 100, total: 300 },
  { name: "Mar", new: 250, returning: 130, total: 380 },
  { name: "Apr", new: 280, returning: 140, total: 420 }
];

export default function CustomerChart() {
  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h3 className="font-bold text-gray-800 mb-3">Customer Insights</h3>

      <BarChart width={500} height={250} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="new" fill="#60A5FA" name="New Customers" />
        <Bar dataKey="returning" fill="#F97316" name="Returning Customers" />
        <Line type="monotone" dataKey="total" stroke="#22C55E" name="Total Sales" />
      </BarChart>
    </div>
  );
}
