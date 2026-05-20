import { NavLink, Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  FiHome,
  FiBox,
  FiShoppingCart,
  FiUsers,
  FiChevronDown,
  FiChevronRight,
  FiEdit3,
  FiLogOut,
  FiUserCheck,
  FiCheckCircle,
  FiStar,
  FiTag,
  FiMail,
} from "react-icons/fi";

export default function Sidebar({ collapsed, setCollapsed, mobileOpen = false, setMobileOpen = () => {} }) {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState("");
  const handleNavClick = () => {
    if (mobileOpen) setMobileOpen(false);
  };
  // Map routes to menu keys
  const routeToMenu = () => {
    const path = location.pathname;
    if (
      path.startsWith("/admin/products") ||
      path.startsWith("/admin/categories") ||
      path.startsWith("/admin/add-product") ||
      path.startsWith("/admin/product-approval") ||
      path.startsWith("/admin/featured-products")
    )
      return "products";
    if (
      path.startsWith("/admin/orders") ||
      path.startsWith("/admin/payment-status")
    )
      return "orders";
    if (
      path.startsWith("/admin/user-list") ||
      path.startsWith("/admin/add-user")
    )
      return "users";
    if (
      path.startsWith("/admin/sellers") ||
      path.startsWith("/admin/seller-approval") ||
      path.startsWith("/admin/seller-details")
    )
      return "sellers";
    if (path.startsWith("/admin/add-blog") || path.startsWith("/admin/blogs"))
      return "blogs";
    if (path.startsWith("/admin/contact-messages"))
      return "contact";
    return "";
  };

  // Sync openMenu with route when collapsed changes or route changes
  useEffect(() => {
    if (!collapsed) {
      const menu = routeToMenu();
      setOpenMenu(menu);
      localStorage.setItem("openMenu", menu);
    }
  }, [collapsed, location.pathname]);
  const [hoverMenu, setHoverMenu] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const productRef = useRef(null);
  const orderRef = useRef(null);
  const userRef = useRef(null);
  const sellerRef = useRef(null);
  const blogRef = useRef(null);
  const contactRef = useRef(null);

  const navigate = useNavigate();
  useEffect(() => {
    const saved = localStorage.getItem("openMenu");
    if (saved) setOpenMenu(saved);
  }, []);

  const toggleMenu = (menuName) => {
    const newVal = openMenu === menuName ? "" : menuName;
    setOpenMenu(newVal);
    localStorage.setItem("openMenu", newVal);
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
    setHoverMenu(null);
  };

  const openFloatingMenu = (ref, type) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMenuPos({ top: rect.top, left: rect.right + 12 });
    setHoverMenu(type);
  };

  const iconWrap = "flex flex-col items-center gap-1 text-white text-xs";

  const Label = ({ children }) => (
    <span className={`${collapsed ? "text-xs mt-1 block text-center" : ""}`}>
      {children}
    </span>
  );
  const handleLogout = () => {
    localStorage.removeItem("auth");
    navigate("/admin/login");
  };

  return (
    <>
      <div
        className={`fixed z-50 left-0 top-0 h-screen flex flex-col bg-[#04753D] text-white shadow-xl transition-all duration-300 rounded-tr-3xl rounded-br-3xl ${
          collapsed ? "w-20 md:w-20 w-72" : "w-60 md:w-60 w-72"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Logo */}
        {/* Logo */}
        <Link to="/admin" className="no-underline text-white" onClick={handleNavClick}>
          <div className="h-[72px] flex items-center justify-center border-b border-gray-800">
            <h1 className={`font-bold ${collapsed ? "text-lg" : "text-2xl"}`}>
              Uptula
            </h1>
          </div>
        </Link>

        {/* NAVIGATION */}
        <nav className="flex-1 px-2 mt-2 overflow-y-auto space-y-2 sidebar-scroll" onClick={handleNavClick}>
          {/* Dashboard */}
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `p-3 rounded-lg cursor-pointer flex dropdown-header transition-all duration-200 no-underline text-white
              ${collapsed ? iconWrap : "items-center gap-3"}
              ${
                isActive
                  ? "bg-green-600 text-white shadow-md scale-[1.01]"
                  : "text-gray-300 hover:bg-[#1b1d20]"
              }`
            }
          >
            <FiHome size={20} />
            <Label>Dashboard</Label>
          </NavLink>

          {/* PRODUCTS */}
          <div
            ref={productRef}
            className={`p-3 rounded-lg cursor-pointer flex dropdown-header transition-all duration-200 
            ${collapsed ? iconWrap : "items-center justify-between"}
            hover:bg-[#1b1d20]
            ${
              openMenu === "products"
                ? "bg-green-600/20 border-l-4 border-green-500 shadow-sm"
                : ""
            }
          `}
            onClick={(e) => {
              e.stopPropagation();
              collapsed
                ? openFloatingMenu(productRef, "products")
                : toggleMenu("products");
            }}
          >
            <div
              className={`flex ${
                collapsed ? "flex-col items-center" : "items-center gap-3"
              }`}
            >
              <FiBox size={20} />
              <Label>Products</Label>
            </div>

            {!collapsed && (
              <FiChevronDown
                className={`transform transition-transform duration-300 ${
                  openMenu === "products" ? "rotate-180 text-green-400" : ""
                }`}
              />
            )}
          </div>

          {/* PRODUCTS SUBMENU */}
          <div
            className={`submenu ml-8 space-y-2 text-sm text-gray-300 transition-all  ${
              openMenu === "products" && !collapsed
                ? "submenu-open"
                : "submenu-closed"
            }`}
          >
            <NavLink
              to="/admin/products"
              onClick={() => setOpenMenu("products")}
              className={({ isActive }) =>
                `block p-2 rounded transition no-underline text-white ${
                  isActive
                    ? "bg-green-600/60 text-white"
                    : "hover:bg-[#fff] hover:text-black"
                }`
              }
            >
              Products List
            </NavLink>

            <NavLink
              to="/admin/categories"
              onClick={() => setOpenMenu("products")}
              className={({ isActive }) =>
                `block p-2 rounded transition no-underline text-white ${
                  isActive
                    ? "bg-green-600/60 text-white"
                    : "hover:bg-[#fff] hover:text-black"
                }`
              }
            >
              Categories
            </NavLink>

            <NavLink
              to="/admin/add-product"
              onClick={() => setOpenMenu("products")}
              className={({ isActive }) =>
                `block p-2 rounded transition no-underline text-white ${
                  isActive
                    ? "bg-green-600/60 text-white"
                    : "hover:bg-[#fff] hover:text-black"
                }`
              }
            >
              Add Product
            </NavLink>

            <NavLink
              to="/admin/product-approval"
              onClick={() => setOpenMenu("products")}
              className={({ isActive }) =>
                `block p-2 rounded transition no-underline text-white ${
                  isActive
                    ? "bg-green-600/60 text-white"
                    : "hover:bg-[#fff] hover:text-black"
                }`
              }
            >
              Product Approval
            </NavLink>

            <NavLink
              to="/admin/featured-products"
              onClick={() => setOpenMenu("products")}
              className={({ isActive }) =>
                `block p-2 rounded transition no-underline text-white ${
                  isActive
                    ? "bg-green-600/60 text-white"
                    : "hover:bg-[#fff] hover:text-black"
                }`
              }
            >
              Featured Products
            </NavLink>


            <NavLink
              to="/admin/refund-products"
              onClick={() => setOpenMenu("products")}
              className={({ isActive }) =>
                `block p-2 rounded transition no-underline text-white ${
                  isActive
                    ? "bg-green-600/60 text-white"
                    : "hover:bg-[#fff] hover:text-black"
                }`
              }
            >
              Refund Products
            </NavLink>
          </div>

          {/* ORDERS */}
          <div
            ref={orderRef}
            className={`p-3 rounded-lg cursor-pointer flex dropdown-header transition-all duration-200 
            ${collapsed ? iconWrap : "items-center justify-between"}
            hover:bg-[#1b1d20]
            ${
              openMenu === "orders"
                ? "bg-green-600/20 border-l-4 border-green-500 shadow-sm"
                : ""
            }
          `}
            onClick={(e) => {
              e.stopPropagation();
              collapsed
                ? openFloatingMenu(orderRef, "orders")
                : toggleMenu("orders");
            }}
          >
            <div
              className={`flex ${
                collapsed ? "flex-col items-center" : "items-center gap-3"
              }`}
            >
              <FiShoppingCart size={20} />
              <Label>Orders</Label>
            </div>

            {!collapsed && (
              <FiChevronDown
                className={`transform transition-transform duration-300 ${
                  openMenu === "orders" ? "rotate-180 text-green-400" : ""
                }`}
              />
            )}
          </div>

          <div
            className={`submenu ml-8 space-y-2 text-sm text-gray-300 transition-all ${
              openMenu === "orders" && !collapsed
                ? "submenu-open"
                : "submenu-closed"
            }`}
          >
            <NavLink
              to="/admin/orders"
              onClick={() => setOpenMenu("orders")}
              className={({ isActive }) =>
                `block p-2 rounded transition no-underline text-white ${
                  isActive
                    ? "bg-green-600/60 text-white"
                    : "hover:bg-[#fff] hover:text-black"
                }`
              }
            >
              All Orders
            </NavLink>

            <NavLink
              to="/admin/payment-status"
              onClick={() => setOpenMenu("orders")}
              className={({ isActive }) =>
                `block p-2 rounded transition no-underline text-white ${
                  isActive
                    ? "bg-green-600/60 text-white"
                    : "hover:bg-[#fff] hover:text-black"
                }`
              }
            >
              Payment Status
            </NavLink>
          </div>

          {/* USERS */}
          <div
            ref={userRef}
            className={`p-3 rounded-lg cursor-pointer flex dropdown-header transition-all duration-200 
            ${collapsed ? iconWrap : "items-center justify-between"}
            hover:bg-[#1b1d20]
            ${
              openMenu === "users"
                ? "bg-green-600/20 border-l-4 border-green-500 shadow-sm"
                : ""
            }
          `}
            onClick={(e) => {
              e.stopPropagation();
              collapsed
                ? openFloatingMenu(userRef, "users")
                : toggleMenu("users");
            }}
          >
            <div
              className={`flex ${
                collapsed ? "flex-col items-center" : "items-center gap-3"
              }`}
            >
              <FiUsers size={20} />
              <Label>Users</Label>
            </div>

            {!collapsed && (
              <FiChevronDown
                className={`transform transition-transform duration-300 ${
                  openMenu === "users" ? "rotate-180 text-green-400" : ""
                }`}
              />
            )}
          </div>

          <div
            className={`submenu ml-8 space-y-2 text-sm text-gray-300 transition-all ${
              openMenu === "users" && !collapsed
                ? "submenu-open"
                : "submenu-closed"
            }`}
          >
            <NavLink
              to="/admin/user-list"
              onClick={() => setOpenMenu("users")}
              className={({ isActive }) =>
                `block p-2 rounded transition no-underline text-white ${
                  isActive
                    ? "bg-green-600/60 text-white"
                    : "hover:bg-[#fff] hover:text-black"
                }`
              }
            >
              User List
            </NavLink>

            <NavLink
              to="/admin/add-user"
              onClick={() => setOpenMenu("users")}
              className={({ isActive }) =>
                `block p-2 rounded transition no-underline text-white ${
                  isActive
                    ? "bg-green-600/60 text-white"
                    : "hover:bg-[#fff] hover:text-black"
                }`
              }
            >
              Add User
            </NavLink>
          </div>

          {/* SELLERS */}
          <div
            ref={sellerRef}
            className={`p-3 rounded-lg cursor-pointer flex dropdown-header transition-all duration-200 
            ${collapsed ? iconWrap : "items-center justify-between"}
            hover:bg-[#1b1d20]
            ${
              openMenu === "sellers"
                ? "bg-green-600/20 border-l-4 border-green-500 shadow-sm"
                : ""
            }
          `}
            onClick={(e) => {
              e.stopPropagation();
              collapsed
                ? openFloatingMenu(sellerRef, "sellers")
                : toggleMenu("sellers");
            }}
          >
            <div
              className={`flex ${
                collapsed ? "flex-col items-center" : "items-center gap-3"
              }`}
            >
              <FiUserCheck size={20} />
              <Label>Sellers</Label>
            </div>

            {!collapsed && (
              <FiChevronDown
                className={`transform transition-transform duration-300 ${
                  openMenu === "sellers" ? "rotate-180 text-green-400" : ""
                }`}
              />
            )}
          </div>

          <div
            className={`submenu ml-8 space-y-2 text-sm text-gray-300 transition-all ${
              openMenu === "sellers" && !collapsed
                ? "submenu-open"
                : "submenu-closed"
            }`}
          >
            <NavLink
              to="/admin/seller-approval"
              onClick={() => setOpenMenu("sellers")}
              className={({ isActive }) =>
                `block p-2 rounded transition no-underline text-white ${
                  isActive
                    ? "bg-green-600/60 text-white"
                    : "hover:bg-[#fff] hover:text-black"
                }`
              }
            >
              Seller Approval
            </NavLink>

            <NavLink
              to="/admin/sellers"
              onClick={() => setOpenMenu("sellers")}
              className={({ isActive }) =>
                `block p-2 rounded transition no-underline text-white ${
                  isActive
                    ? "bg-green-600/60 text-white"
                    : "hover:bg-[#fff] hover:text-black"
                }`
              }
            >
              Seller Details
            </NavLink>
          </div>

          {/* BLOGS */}
          <div
            ref={blogRef}
            className={`p-3 rounded-lg cursor-pointer flex dropdown-header transition-all duration-200 
            ${collapsed ? iconWrap : "items-center justify-between"}
            hover:bg-[#1b1d20]
            ${
              openMenu === "blogs"
                ? "bg-green-600/20 border-l-4 border-green-500 shadow-sm"
                : ""
            }
          `}
            onClick={(e) => {
              e.stopPropagation();
              collapsed
                ? openFloatingMenu(blogRef, "blogs")
                : toggleMenu("blogs");
            }}
          >
            <div
              className={`flex ${
                collapsed ? "flex-col items-center" : "items-center gap-3"
              }`}
            >
              <FiEdit3 size={20} />
              <Label>Blogs</Label>
            </div>

            {!collapsed && (
              <FiChevronDown
                className={`transform transition-transform duration-300 ${
                  openMenu === "blogs" ? "rotate-180 text-green-400" : ""
                }`}
              />
            )}
          </div>

          <div
            className={`submenu ml-8 space-y-2 text-sm text-gray-300 transition-all ${
              openMenu === "blogs" && !collapsed
                ? "submenu-open"
                : "submenu-closed"
            }`}
          >
            <NavLink
              to="/admin/add-blog"
              onClick={() => setOpenMenu("blogs")}
              className={({ isActive }) =>
                `block p-2 rounded transition no-underline text-white ${
                  isActive
                    ? "bg-green-600/60 text-white"
                    : "hover:bg-[#fff] hover:text-black"
                }`
              }
            >
              Add Blog
            </NavLink>

            <NavLink
              to="/admin/blogs"
              onClick={() => setOpenMenu("blogs")}
              className={({ isActive }) =>
                `block p-2 rounded transition no-underline text-white ${
                  isActive
                    ? "bg-green-600/60 text-white"
                    : "hover:bg-[#fff] hover:text-black"
                }`
              }
            >
              View Blogs
            </NavLink>
          </div>

          {/* CONTACT MESSAGES */}
          <div
            ref={contactRef}
            className={`p-3 rounded-lg cursor-pointer flex dropdown-header transition-all duration-200 
            ${collapsed ? iconWrap : "items-center justify-between"}
            hover:bg-[#1b1d20]
            ${
              openMenu === "contact"
                ? "bg-green-600/20 border-l-4 border-green-500 shadow-sm"
                : ""
            }
          `}
            onClick={(e) => {
              e.stopPropagation();
              collapsed
                ? openFloatingMenu(contactRef, "contact")
                : toggleMenu("contact");
            }}
          >
            <div
              className={`flex ${
                collapsed ? "flex-col items-center" : "items-center gap-3"
              }`}
            >
              <FiMail size={20} />
              <Label>Contact Messages</Label>
            </div>

            {!collapsed && (
              <FiChevronDown
                className={`transform transition-transform duration-300 ${
                  openMenu === "contact" ? "rotate-180 text-green-400" : ""
                }`}
              />
            )}
          </div>

          <div
            className={`submenu ml-8 space-y-2 text-sm text-gray-300 transition-all ${
              openMenu === "contact" && !collapsed
                ? "submenu-open"
                : "submenu-closed"
            }`}
          >
            <NavLink
              to="/admin/contact-messages"
              onClick={() => setOpenMenu("contact")}
              className={({ isActive }) =>
                `block p-2 rounded transition no-underline text-white ${
                  isActive
                    ? "bg-green-600/60 text-white"
                    : "hover:bg-[#fff] hover:text-black"
                }`
              }
            >
              View Messages
            </NavLink>
          </div>
        </nav>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="mx-3 mb-3 mt-2 bg-white hover:bg-black transition p-3 rounded-lg flex items-center justify-center gap-3 text-black  hover:text-white"
        >
          <FiLogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>

        {/* COLLAPSE BUTTON */}
        <div className="p-4 flex justify-center ">
          <button
            onClick={toggleCollapse}
            className="bg-white text-black p-3 rounded-full hover:bg-gray-300 transition"
          >
            <FiChevronRight
              className={`transition-transform duration-300 ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* FLOATING MENU (collapsed mode only) */}
      {collapsed && hoverMenu && (
        <div
          className="fixed bg-[#0e0f11] text-white shadow-xl rounded-lg p-3 w-44 z-50 animate-slideIn"
          style={{ top: menuPos.top, left: menuPos.left }}
          onMouseLeave={() => setHoverMenu(null)}
        >
          {hoverMenu === "products" && (
            <>
              <NavLink
                to="/admin/products"
                className="block px-3 py-2 no-underline text-white hover:bg-[#1f2124]"
              >
                Products List
              </NavLink>
              <NavLink
                to="/admin/categories"
                className="block px-3 py-2 no-underline text-white hover:bg-[#1f2124]"
              >
                Categories
              </NavLink>
              <NavLink
                to="/admin/add-product"
                className="block px-3 py-2 no-underline text-white hover:bg-[#1f2124]"
              >
                Add Product
              </NavLink>
            </>
          )}

          {hoverMenu === "orders" && (
            <>
              <NavLink
                to="/admin/orders"
                className="block px-3 py-2 no-underline text-white hover:bg-[#1f2124]"
              >
                All Orders
              </NavLink>
              <NavLink
                to="/admin/payment-status"
                className="block px-3 py-2 no-underline text-white hover:bg-[#1f2124]"
              >
                Payment Status
              </NavLink>
            </>
          )}

          {hoverMenu === "users" && (
            <>
              <NavLink
                to="/admin/user-list"
                className="block px-3 py-2 no-underline text-white hover:bg-[#1f2124]"
              >
                User List
              </NavLink>
              <NavLink
                to="/admin/add-user"
                className="block px-3 py-2 no-underline text-white hover:bg-[#1f2124]"
              >
                Add User
              </NavLink>
            </>
          )}

          {hoverMenu === "sellers" && (
            <>
              <NavLink
                to="/admin/seller-approval"
                className="block px-3 py-2 no-underline text-white hover:bg-[#1f2124]"
              >
                Seller Approval
              </NavLink>
              <NavLink
                to="/admin/sellers"
                className="block px-3 py-2 no-underline text-white hover:bg-[#1f2124]"
              >
                Seller Details
              </NavLink>
            </>
          )}

          {hoverMenu === "blogs" && (
            <>
              <NavLink
                to="/admin/add-blog"
                className="block px-3 py-2 no-underline text-white hover:bg-[#1f2124]"
              >
                Add Blog
              </NavLink>
              <NavLink
                to="/admin/blogs"
                className="block px-3 py-2 no-underline text-white hover:bg-[#1f2124]"
              >
                View Blogs
              </NavLink>
            </>
          )}

          {hoverMenu === "contact" && (
            <>
              <NavLink
                to="/admin/contact-messages"
                className="block px-3 py-2 no-underline text-white hover:bg-[#1f2124]"
              >
                View Messages
              </NavLink>
            </>
          )}
        </div>
      )}

      {/* CSS */}
      <style>{`
        @keyframes slideIn { 
          from { opacity: 0; transform: translateX(-12px); } 
          to { opacity: 1; transform: translateX(0); } 
        }
        .animate-slideIn {
          animation: slideIn 0.2s ease-out;
        }

        .submenu {
          overflow: hidden;
          transition: max-height 0.33s ease, opacity 0.25s ease;
        }
        .submenu-open {
          max-height: 400px;
          opacity: 1;
        }
        .submenu-closed {
          max-height: 0;
          opacity: 0;
        }

        .dropdown-header:hover {
          background: rgba(255,255,255,0.06);
        }

        .sidebar-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: #444;
          border-radius: 12px;
        }
        .sidebar-scroll:hover::-webkit-scrollbar-thumb {
          background: #555;
        }
      `}</style>
    </>
  );
}
