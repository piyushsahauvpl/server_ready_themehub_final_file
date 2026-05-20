import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useState } from "react";

export default function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`min-h-screen bg-gray-100 transition-all duration-300 ml-0 ${collapsed ? "md:ml-20 lg:ml-20" : "md:ml-60 lg:ml-60"}`}>

      {/* SIDEBAR */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* TOPBAR */}
      <Topbar collapsed={collapsed} mobileOpen={mobileOpen} onMobileToggle={() => setMobileOpen(!mobileOpen)} />

      {/* MAIN CONTENT */}
      <main className="pt-[92px] px-4 sm:px-5 md:px-6 pb-6">
        <div className="w-full overflow-x-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
