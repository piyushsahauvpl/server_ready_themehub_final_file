import { FiUser, FiLogOut, FiBell, FiMail, FiMenu } from "react-icons/fi";
import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
 
export default function Topbar({ collapsed, mobileOpen, onMobileToggle }) {
  const [openProfile, setOpenProfile] = useState(false);
  const [openNotify, setOpenNotify] = useState(false);
  const [openMail, setOpenMail] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
 
  const navigate = useNavigate();
  const notifyRef = useRef();
  const mailRef = useRef();
  const profileRef = useRef();
 
  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
  const ADMIN_API_URL = `${API_URL}/admin`;
 
  // Fetch real alerts data
  useEffect(() => {
    const fetchAlerts = async () => {
      setLoadingAlerts(true);
      try {
        const newAlerts = [];
 
        // Fetch recent users (new registrations)
        try {
          const usersRes = await fetch(`${ADMIN_API_URL}/users.php?page=1&per_page=5`, { credentials: "include" });
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            const users = usersData.users ? usersData.users.slice(0, 2) : [];
           
            users.forEach(user => {
              newAlerts.push({
                color: "bg-blue-500",
                date: new Date(user.created_at).toLocaleDateString(),
                text: `New user registered: ${user.full_name}`,
                type: 'user'
              });
            });
          }
        } catch (err) {
          console.error('Failed to fetch users', err);
        }
 
        // Fetch recent orders
        try {
          const ordersRes = await fetch(`${ADMIN_API_URL}/orders.php?page=1&per_page=5`, { credentials: "include" });
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            const orders = ordersData.orders ? ordersData.orders.slice(0, 2) : [];
           
            orders.forEach(order => {
              newAlerts.push({
                color: order.status === 'completed' ? "bg-green-500" : order.status === 'pending' ? "bg-yellow-500" : "bg-red-500",
                date: new Date(order.created_at).toLocaleDateString(),
                text: `Order #${order.id} - ${order.customer_name} (${order.status})`,
                type: 'order'
              });
            });
          }
        } catch (err) {
          console.error('Failed to fetch orders', err);
        }
 
        setAlerts(newAlerts.length > 0 ? newAlerts : getDefaultAlerts());
      } catch (err) {
        console.error('Failed to fetch alerts', err);
        setAlerts(getDefaultAlerts());
      } finally {
        setLoadingAlerts(false);
      }
    };
 
    fetchAlerts();
    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [ADMIN_API_URL]);
 
  const getDefaultAlerts = () => [
    {
      color: "bg-blue-500",
      date: new Date().toLocaleDateString(),
      text: "No new alerts at the moment.",
      type: 'default'
    }
  ];
  // TICKETS (Message center) - fetch live support tickets
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Derived counts for badges
  const newAlertsCount = alerts.filter(a => a.type && a.type !== 'default').length;
  const ticketsCount = tickets.length;
 
  useEffect(() => {
    let mounted = true;
    const fetchTickets = async () => {
      setLoadingTickets(true);
      try {
        const res = await fetch(`${ADMIN_API_URL}/tickets.php?limit=5`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load tickets');
        const data = await res.json();
        if (mounted) setTickets(data.tickets || data.data || []);
      } catch (err) {
        console.error('Failed to fetch tickets', err);
        if (mounted) setTickets([]);
      } finally {
        if (mounted) setLoadingTickets(false);
      }
    };
 
    fetchTickets();
    const iv = setInterval(fetchTickets, 60 * 1000);
    return () => { mounted = false; clearInterval(iv); };
  }, [ADMIN_API_URL]);
 
  // LOGOUT
  const handleLogout = async () => {
    try {
      await fetch(`${ADMIN_API_URL}/logout.php`, {
        method: "POST",
        credentials: "include"
      });
    } catch (err) {
      console.warn("Logout request failed", err);
    } finally {
      localStorage.removeItem("admin_auth");
      localStorage.removeItem("admin_user");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth");
      localStorage.removeItem("user");
      navigate("/admin/login", { replace: true });
    }
  };
 
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifyRef.current && !notifyRef.current.contains(e.target)) setOpenNotify(false);
      if (mailRef.current && !mailRef.current.contains(e.target)) setOpenMail(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setOpenProfile(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
 
  return (
    <div
      className={`
        fixed top-0 right-0 left-0 h-[72px]
        bg-white shadow flex items-center justify-between
        px-4 z-40 transition-all duration-300 rounded-t-3xl rounded-b-3xl mt-2
        ${collapsed ? "md:left-20 lg:left-20" : "md:left-60 lg:left-60"}
      `}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-700 text-white shadow-md md:hidden"
          onClick={onMobileToggle}
          aria-label="Toggle navigation"
        >
          <FiMenu size={20} />
        </button>
        <h2 className="text-lg font-semibold text-gray-800">Dashboard</h2>
      </div>
 
      <div className="flex items-center gap-6 relative">
 
        {/* NOTIFICATIONS */}
        <div ref={notifyRef} className="relative cursor-pointer" onClick={() => {
          setOpenNotify(!openNotify);
          setOpenMail(false);
          setOpenProfile(false);
        }}>
          <FiBell size={22} />
          {newAlertsCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-2">
              {newAlertsCount}
            </span>
          )}
 
          {openNotify && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-lg border">
              <div className="px-4 py-2 bg-blue-600 text-white font-semibold">
                Alerts Center
              </div>
              <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
                {loadingAlerts ? (
                  <div className="text-center py-4 text-gray-500">Loading alerts...</div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No alerts</div>
                ) : (
                  alerts.map((a, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${a.color} flex-shrink-0`}>
                        <FiBell size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{a.date}</p>
                        <p className="text-sm text-gray-800">{a.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
 
         {/* MESSAGE CENTER */}
        <div
          className="relative cursor-pointer"
          ref={mailRef}
          onClick={() => {
            setOpenMail(!openMail);
            setOpenNotify(false);
            setOpenProfile(false);
          }}
        >
          <FiMail size={22} className="text-gray-700" />
          {ticketsCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-2">
              {ticketsCount}
            </span>
          )}
 
          {openMail && (
            <div
              className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-lg border overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-2 bg-blue-600 text-white font-semibold">
                Message Center
              </div>
 
              <div className="p-3 space-y-4 max-h-80 overflow-y-auto">
                {loadingTickets ? (
                  <div className="text-center py-4 text-gray-500">Loading tickets...</div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No recent tickets</div>
                ) : (
                  tickets.map((t, i) => (
                    <div key={t.id || i} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
                        {t.status ? t.status.charAt(0).toUpperCase() : '#'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 font-medium">{t.subject || t.title || `Ticket #${t.id}`}</p>
                        <p className="text-xs text-gray-500">
                          {t.customer_name || t.user_email || t.user || ''} · {t.status || 'N/A'} · {t.created_at ? new Date(t.created_at).toLocaleString() : ''}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
 
              <div className="py-2 text-center text-blue-600 text-sm hover:bg-gray-100 cursor-pointer" onClick={() => { navigate('/admin/tickets'); }}>
                View Tickets
              </div>
            </div>
          )}
        </div>
 
        {/* PROFILE */}
        <div ref={profileRef} className="relative cursor-pointer flex items-center gap-2" onClick={() => {
          setOpenProfile(!openProfile);
          setOpenNotify(false);
          setOpenMail(false);
        }}>
          <FiUser />
          <span className="font-medium">Admin</span>
 
          {openProfile && (
            <div className="absolute right-0 top-[56px] w-44 bg-white border shadow rounded-lg">
              <Link to="">
                <button className="w-full px-4 py-2 text-left hover:bg-gray-100">
                  Settings
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 flex items-center gap-2"
              >
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>
 
      </div>
    </div>
  );
}
 
 