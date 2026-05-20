import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiBox,
  FiChevronRight,
  FiLogOut,
  FiLock,
} from "react-icons/fi";
 
export default function Sidebar({ collapsed, setCollapsed, mobileOpen = false, setMobileOpen = () => {} }) {
  const navigate = useNavigate();
 
  const handleLogout = () => {
    localStorage.removeItem("cs_token");
    localStorage.removeItem("cs_user");
    navigate("/cs/login");
  };
 
  const iconWrap =
    "flex flex-col items-center justify-center gap-1 text-xs text-white";
 
  const Label = ({ children }) => (
    <span className={`${collapsed ? "text-xs text-center mt-1" : "text-sm"}`}>
      {children}
    </span>
  );
 
  return (
    <>
      <div
        className={`fixed left-0 top-0 z-40 h-screen w-60 bg-black text-white flex flex-col
        transition-all duration-300 rounded-tr-3xl rounded-br-3xl shadow-2xl
        ${collapsed ? "md:w-28" : "md:w-60"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* LOGO */}
        <Link to="/cs" className="text-white no-underline" onClick={() => setMobileOpen(false)}>
          <div className="h-[72px] flex items-center justify-center border-b border-gray-800">
            <h1 className="font-bold text-xl">Uptula</h1>
          </div>
        </Link>
 
        {/* NAV */}
        <nav className="flex-1 px-2 mt-3 space-y-2 overflow-y-auto sidebar-scroll">
          {/* DASHBOARD */}
          <NavLink
            to="/cs"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `p-3 rounded-lg flex transition no-underline
    ${collapsed ? iconWrap : "items-center gap-3"}
    ${
      isActive
        ? "text-white border-l-4"
        : "text-white hover:bg-[#1b1d20]"
    }`
            }
            style={({ isActive }) => isActive ? { backgroundColor: "#04733c", borderLeftColor: "#035a2f" } : undefined}
          >
            <FiHome size={20} />
            <Label>Dashboard</Label>
          </NavLink>
 
          {/* TICKETS */}
          <NavLink
            to="/cs/ticket"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `p-3 rounded-lg flex transition no-underline
    ${collapsed ? iconWrap : "items-center gap-3"}
    ${
      isActive
        ? "text-white border-l-4"
        : "text-white hover:bg-[#1b1d20]"
    }`
            }
            style={({ isActive }) => isActive ? { backgroundColor: "#04733c", borderLeftColor: "#035a2f" } : undefined}
          >
            <FiBox size={20} />
            <Label>Tickets</Label>
          </NavLink>

          {/* RESET PASSWORD */}
          <NavLink
            to="/cs/reset-user-password"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `p-3 rounded-lg flex transition no-underline
    ${collapsed ? iconWrap : "items-center gap-3"}
    ${
      isActive
        ? "text-white border-l-4"
        : "text-white hover:bg-[#1b1d20]"
    }`
            }
            style={({ isActive }) => isActive ? { backgroundColor: "#04733c", borderLeftColor: "#035a2f" } : undefined}
          >
            <FiLock size={20} />
            <Label>Reset Password</Label>
          </NavLink>
        </nav>
 
        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="mx-3 mb-3 bg-white text-black p-3 rounded-xl flex items-center justify-center gap-2
          hover:bg-black hover:text-white transition"
        >
          <FiLogOut size={18} />
          {!collapsed && "Logout"}
        </button>
 
        {/* COLLAPSE BUTTON */}
        <div className="p-4 flex justify-center border-t border-gray-800">
          <button
            onClick={() => {
              setCollapsed(!collapsed);
            }}
            className="hidden bg-white text-black p-3 rounded-full transition md:block"
          >
            <FiChevronRight
              className={`transition-transform duration-300 ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>
 
 
 
      {/* CSS */}
      <style>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: #444;
          border-radius: 12px;
        }
      `}</style>
    </>
  );
}
 
