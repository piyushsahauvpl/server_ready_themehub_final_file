import {
  FiUsers,
  FiBox,
  FiShoppingCart,
} from "react-icons/fi";

// Custom Rupees Icon Component
const FiRupee = ({ size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 3h12M6 8h10c1 0 2-1 2-2M6 3v18M6 8h10"></path>
    <line x1="6" y1="13" x2="16" y2="13"></line>
    <path d="M16 13c0 0 2-1 2-3s-1-3-3-3H6"></path>
  </svg>
);

export default function OverviewCard({ title, value, color }) {
  const iconByTitle = {
    "Total Users": <FiUsers size={22} />,
    "Total Products": <FiBox size={22} />,
    "Total Orders": <FiShoppingCart size={22} />,
    "Total Revenue": <FiRupee size={22} />,
  };

  return (
    <div
      className="bg-white rounded-xl p-5 shadow-sm border-l-4 hover:shadow-md transition flex items-center justify-between"
      style={{ borderColor: color }}
    >
      {/* Left Content */}
      <div>
        <p className="text-sm font-medium text-gray-500">
          {title}
        </p>
        <h3
          className="text-3xl font-bold mt-2"
          style={{ color }}
        >
          {value}
        </h3>
      </div>

      {/* Right Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{
          backgroundColor: `${color}20`,
          color: color,
        }}
      >
        {iconByTitle[title]}
      </div>
    </div>
  );
}
