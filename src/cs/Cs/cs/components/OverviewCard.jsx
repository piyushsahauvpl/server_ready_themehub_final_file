export default function OverviewCard({ title, value, color }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-md border-l-4" style={{ borderColor: color }}>
      <p className="font-semibold text-gray-800">{title}</p>
      <h3 className="text-3xl font-bold mt-2" style={{ color }}>{value}</h3>
    </div>
  );
}
