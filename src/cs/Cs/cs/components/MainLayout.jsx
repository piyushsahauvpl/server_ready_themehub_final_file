import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useState } from "react";

export default function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* SIDEBAR */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* RIGHT SIDE (Topbar + Main Content) */}
      <div
        className={`
          flex-1 transition-all duration-300
          ${collapsed ? "ml-20" : "ml-60"}
        `}
      >
        {/* TOPBAR */}
        <Topbar collapsed={collapsed} />

        {/* MAIN CONTENT */}
        <main className="pt-[90px] px-6 pb-6">
          <div className="w-full overflow-x-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
