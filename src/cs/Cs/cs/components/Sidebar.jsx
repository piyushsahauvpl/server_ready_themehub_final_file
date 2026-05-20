import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  FiHome,
  FiBox,
  FiShoppingCart,
  FiUsers,
  FiChevronDown,
  FiChevronRight,
  FiEdit3,
  FiLogOut,
} from "react-icons/fi";
 
export default function Sidebar({ collapsed, setCollapsed }) {
  const [openMenu, setOpenMenu] = useState("");
  const [hoverMenu, setHoverMenu] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
 
  const productRef = useRef(null);
  const orderRef = useRef(null);
  const userRef = useRef(null);
  const blogRef = useRef(null);
 
  const navigate = useNavigate();
  const location = useLocation();
 
  /* ---------- ACTIVE ROUTE → ACTIVE SECTION ---------- */
  useEffect(() => {
    const path = location.pathname;
 
    if (
      path.startsWith("/cs/ticket") ||
      path.startsWith("/cs/createticket") ||
      path.startsWith("/cs/ticketdetails") ||
      path.startsWith("/cs/tickettracking")
    ) {
      setOpenMenu("products");
    } else if (
      path.startsWith("/cs/orders") ||
      path.startsWith("/cs/payment-status")
    ) {
      setOpenMenu("orders");
    } else if (
      path === "/cs/user-list" ||
      path === "/cs/add-user" ||
      path === "/cs/customerfeedback"
    ) {
      setOpenMenu("users");
    } else if (
      path === "/cs/communicationtools" ||
      path === "/cs/customerInformation"
    ) {
      setOpenMenu("blogs");
    } else {
      setOpenMenu("");
    }
  }, [location.pathname]);
 
  const toggleMenu = (menu) => {
    setOpenMenu(menu === openMenu ? "" : menu);
  };
 
  const openFloatingMenu = (ref, menu) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMenuPos({ top: rect.top, left: rect.right + 12 });
    setHoverMenu(menu);
  };
 
  const handleLogout = () => {
    localStorage.removeItem("auth");
    navigate("/login");
  };
 
  const iconWrap =
    "flex flex-col items-center justify-center gap-1 text-xs text-white";
 
  const activeStyle =
    "border-l-4 border-green-500 bg-green-600/15 transition-all duration-300";
 
  const Label = ({ children }) => (
    <span className={`${collapsed ? "text-xs text-center mt-1" : "text-sm"}`}>
      {children}
    </span>
  );
 
  return (
    <>
      <div
        className={`fixed left-0 top-0 h-screen bg-black text-white flex flex-col
        transition-all duration-300 rounded-tr-3xl rounded-br-3xl
        ${collapsed ? "w-28" : "w-60"}`}
      >
        {/* LOGO */}
        <Link to="/cs" className="text-white no-underline">
          <div className="h-[72px] flex items-center justify-center border-b border-gray-800">
            <h1 className="font-bold text-xl">Uptula</h1>
          </div>
        </Link>
 
        {/* NAV */}
        <nav className="flex-1 px-2 mt-3 space-y-2 overflow-y-auto sidebar-scroll">
          {/* DASHBOARD */}
          <NavLink
            to="/cs"
            className={({ isActive }) =>
              `p-3 rounded-lg flex transition no-underline
    ${collapsed ? iconWrap : "items-center gap-3"}
    ${
      isActive
        ? "text-white bg-green-600 border-l-4 border-green-500"
        : "text-white hover:bg-[#1b1d20]"
    }`
            }
          >
            <FiHome size={20} />
            <Label>Dashboard</Label>
          </NavLink>
 
          {/* TICKET */}
          <div
            ref={productRef}
            onClick={() =>
              collapsed
                ? openFloatingMenu(productRef, "products")
                : toggleMenu("products")
            }
            className={`p-3 rounded-xl cursor-pointer transition flex
            ${
              collapsed
                ? "flex-col items-center justify-center"
                : "items-center justify-between"
            }
            ${openMenu === "products" ? activeStyle : ""}`}
          >
            <div
              className={`flex ${
                collapsed ? "flex-col items-center" : "items-center gap-3"
              }`}
            >
              <FiBox size={22} />
              <Label>{collapsed ? "Ticket" : "Ticket Management"}</Label>
            </div>
            {!collapsed && (
              openMenu === "products" ? (
                <FiChevronDown className="rotate-180 transition-transform duration-200" />
              ) : (
                <FiChevronRight className="transition-transform duration-200" />
              )
            )}
          </div>
 
          {!collapsed && openMenu === "products" && (
            <div className="ml-8 space-y-1 text-sm">
              <NavLink className="submenu-link" to="/cs/ticket" onClick={(e) => e.stopPropagation()}>
                View Tickets
              </NavLink>
              <NavLink className="submenu-link" to="/cs/createticket" onClick={(e) => e.stopPropagation()}>
                Create Ticket
              </NavLink>
             
              <NavLink className="submenu-link" to="/cs/tickettracking" onClick={(e) => e.stopPropagation()}>
                Ticket Tracking
              </NavLink>
            </div>
          )}
 
          {/* ORDERS */}
          <div
            ref={orderRef}
            onClick={() =>
              collapsed
                ? openFloatingMenu(orderRef, "orders")
                : toggleMenu("orders")
            }
            className={`p-3 rounded-xl cursor-pointer transition flex
            ${
              collapsed
                ? "flex-col items-center justify-center"
                : "items-center justify-between"
            }
            ${openMenu === "orders" ? activeStyle : ""}`}
          >
            <div
              className={`flex ${
                collapsed ? "flex-col items-center" : "items-center gap-3"
              }`}
            >
              <FiShoppingCart size={22} />
              <Label>Orders</Label>
            </div>
            {!collapsed && (
              openMenu === "orders" ? (
                <FiChevronDown className="rotate-180 transition-transform duration-200" />
              ) : (
                <FiChevronRight className="transition-transform duration-200" />
              )
            )}
          </div>
 
          {!collapsed && openMenu === "orders" && (
            <div className="ml-8 space-y-1 text-sm">
              <NavLink className="submenu-link" to="/cs/orders" onClick={(e) => e.stopPropagation()}>
                All Orders
              </NavLink>
              <NavLink className="submenu-link" to="/cs/payment-status" onClick={(e) => e.stopPropagation()}>
                Payment Status
              </NavLink>
              {/* <NavLink className="submenu-link" to="/cs/reportanalysis" onClick={(e) => e.stopPropagation()}>
                Report Analysis
              </NavLink> */}
            </div>
          )}
 
          {/* USERS */}
          <div
            ref={userRef}
            onClick={() =>
              collapsed
                ? openFloatingMenu(userRef, "users")
                : toggleMenu("users")
            }
            className={`p-3 rounded-xl cursor-pointer transition flex
            ${
              collapsed
                ? "flex-col items-center justify-center"
                : "items-center justify-between"
            }
            ${openMenu === "users" ? activeStyle : ""}`}
          >
            <div
              className={`flex ${
                collapsed ? "flex-col items-center" : "items-center gap-3"
              }`}
            >
              <FiUsers size={22} />
              <Label>Users</Label>
            </div>
            {!collapsed && (
              openMenu === "users" ? (
                <FiChevronDown className="rotate-180 transition-transform duration-200" />
              ) : (
                <FiChevronRight className="transition-transform duration-200" />
              )
            )}
          </div>
 
          {!collapsed && openMenu === "users" && (
            <div className="ml-8 space-y-1 text-sm">
              <NavLink className="submenu-link" to="/cs/user-list" onClick={(e) => e.stopPropagation()}>
                User List
              </NavLink>
              {/* <NavLink className="submenu-link" to="/add-user" onClick={(e) => e.stopPropagation()}>
                Add User
              </NavLink> */}
              <NavLink className="submenu-link" to="/cs/customerfeedback" onClick={(e) => e.stopPropagation()}>
                Customer Feedback
              </NavLink>
              {/* <NavLink className="submenu-link" to="/integration">
                Integration
              </NavLink> */}
            </div>
          )}
 
          {/* COMMUNICATION */}
          <div
            ref={blogRef}
            onClick={() =>
              collapsed
                ? openFloatingMenu(blogRef, "blogs")
                : toggleMenu("blogs")
            }
            className={`p-3 rounded-xl cursor-pointer transition flex
            ${
              collapsed
                ? "flex-col items-center justify-center"
                : "items-center justify-between"
            }
            ${openMenu === "blogs" ? activeStyle : ""}`}
          >
            <div
              className={`flex ${
                collapsed ? "flex-col items-center" : "items-center gap-3"
              }`}
            >
              <FiEdit3 size={22} />
              <Label>
                {collapsed ? "Communication" : "Communication"}
              </Label>
            </div>
            {!collapsed && (
              openMenu === "blogs" ? (
                <FiChevronDown className="rotate-180 transition-transform duration-200" />
              ) : (
                <FiChevronRight className="transition-transform duration-200" />
              )
            )}
          </div>
 
          {!collapsed && openMenu === "blogs" && (
            <div className="ml-8 space-y-1 text-sm">
              <NavLink className="submenu-link" to="/cs/communicationtools" onClick={(e) => e.stopPropagation()}>
                Communication Tools
              </NavLink>
              {/* <NavLink className="submenu-link" to="/customerInformation" onClick={(e) => e.stopPropagation()}>
                Customer Information
              </NavLink> */}
              {/* <NavLink className="submenu-link" to="/reportanalysis">
                Report Analysis
              </NavLink> */}
            </div>
          )}
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
              setHoverMenu(null);
            }}
            className="bg-white text-black p-3 rounded-full transition"
          >
            <FiChevronRight
              className={`transition-transform duration-300 ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>
 
      {/* FLOATING MENUS (COLLAPSED) */}
     {/* FLOATING MENUS (COLLAPSED) */}
{collapsed && hoverMenu && (
  <div
    className="fixed bg-[#0e0f11] text-white rounded-xl shadow-xl w-52 p-2 z-50"
    style={{ top: menuPos.top, left: menuPos.left }}
    onMouseLeave={() => setHoverMenu(null)}
  >
    {/* TICKETS */}
    {hoverMenu === "products" && (
      <>
        <NavLink className="submenu-float" to="/cs/ticket">
          View Tickets
        </NavLink>
        <NavLink className="submenu-float" to="/cs/createticket">
          Create Ticket
        </NavLink>
        
        <NavLink className="submenu-float" to="/cs/tickettracking">
          Ticket Tracking
        </NavLink>
      </>
    )}
 
    {/* ORDERS */}
    {hoverMenu === "orders" && (
      <>
        <NavLink className="submenu-float" to="/cs/orders">
          All Orders
        </NavLink>
        <NavLink className="submenu-float" to="/cs/payment-status">
          Payment Status
        </NavLink>
         {/* <NavLink className="submenu-float" to="/cs/reportanalysis">
          Report Analysis
        </NavLink> */}
        {/* <NavLink className="submenu-float" to="/automation">
          Automation & Productivity
        </NavLink> */}
      </>
    )}
 
    {/* USERS */}
    {hoverMenu === "users" && (
      <>
        <NavLink className="submenu-float" to="/cs/user-list">
          User List
        </NavLink>
       
        <NavLink className="submenu-float" to="/cs/customerfeedback">
          Customer Feedback
        </NavLink>
        
      </>
    )}
 
    {/* COMMUNICATION */}
    {hoverMenu === "blogs" && (
      <>
        <NavLink className="submenu-float" to="/cs/communicationtools">
          Communication Tools
        </NavLink>
       
      </>
    )}
  </div>
)}
 
 
      {/* CSS */}
      <style>{`
        .submenu-link,
        .submenu-float {
          display: block;
          padding: 8px 12px;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
 
        .submenu-link:hover,
        .submenu-float:hover {
          background: white;
          color: black;
        }
 
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
 
