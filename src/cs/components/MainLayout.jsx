import Sidebar from "./Sidebar";
import { useState } from "react";
import { FiMenu } from "react-icons/fi";

export default function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">

      {/* SIDEBAR */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {mobileOpen && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/45 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <div
        className={`
          min-h-screen transition-all duration-300
          ${collapsed ? "md:ml-28" : "md:ml-60"}
        `}
      >
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-emerald-100 bg-white/90 px-4 py-3 shadow-sm backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-700 text-white shadow-md"
            aria-label="Open menu"
          >
            <FiMenu className="h-5 w-5" />
          </button>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Uptula</p>
            <p className="text-sm font-bold text-gray-900">Support Center</p>
          </div>
        </header>

        <main className="p-3 sm:p-5 md:p-6">
          <div className="w-full min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
