// import MainLayout from "./MainLayout";
// import MonthlyReportChart from "./MonthlyReportChart";
// import { motion } from "framer-motion";
// import { Link } from "react-router-dom";
// import { FaChartLine, FaHeart, FaDollarSign, FaUsers } from "react-icons/fa";
// import { useEffect, useState } from "react";
// import axios from "axios";
 
// export default function Dashboard() {
//   const [tickets, setTickets] = useState([]);
//   const [closedTickets, setClosedTickets] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [ordersTotal, setOrdersTotal] = useState(0);
//   const [users, setUsers] = useState([]);
//   const [usersTotal, setUsersTotal] = useState(0);
//   useEffect(() => {
//     fetchTickets();
//     fetchOrders();
//     fetchUsers();
//   }, []);

//   const fetchTickets = async () => {
//     try {
//       const res = await axios.get(
//         "https://uptulathemehub.com/backend/api/tickets.php",
//         { withCredentials: true }
//       );
//       if (res.data.success) {
//         const allTickets = res.data.tickets || [];
//         setTickets(allTickets.filter(ticket => ticket.status !== "Closed"));
//         setClosedTickets(allTickets.filter(ticket => ticket.status === "Closed"));
//       }
//     } catch (err) {}
//   };

//   const fetchOrders = async () => {
//     try {
//       const res = await axios.get(
//         "https://uptulathemehub.com/backend/api/cs/orders.php?page=1&per_page=3",
//         { withCredentials: true }
//       );
//       if (res.data.success) {
//         setOrdersTotal(res.data.meta?.total || 0);
//         setOrders(res.data.data || []);
//       }
//     } catch (err) {}
//   };

//   const fetchUsers = async () => {
//     try {
//       const res = await axios.get(
//         "https://uptulathemehub.com/backend/api/cs/users.php?page=1&per_page=8",
//         { withCredentials: true }
//       );
//       if (res.data.success) {
//         setUsers(res.data.users || []);
//         setUsersTotal(res.data.meta?.total || 0);
//       }
//     } catch (err) {}
//   };

//   return (
//     <MainLayout>
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6 }}
//         className="p-8 space-y-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen"
//       >
//         {/* ===== HEADER ===== */}
//         <div className="mb-8">
//           <h1 className="text-4xl font-bold text-gray-800 mb-2">Dashboard Overview</h1>
//           <p className="text-gray-600">Welcome back! Here's what's happening with your business today.</p>
//         </div>
 
//         {/* ===== STAT CARDS ===== */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//           <motion.div
//             whileHover={{ scale: 1.05, y: -5 }}
//             whileTap={{ scale: 0.95 }}
//             className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
//           >
//             <div className="flex items-center justify-between mb-4">
//               <FaChartLine className="text-3xl" />
//               <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
//                 <span className="text-xl">↑</span>
//               </div>
//             </div>
//             <p className="text-sm opacity-90 font-medium">Total Tickets</p>
//             <h2 className="text-3xl font-bold mt-1">{tickets.length}</h2>
//           </motion.div>
//           <motion.div
//             whileHover={{ scale: 1.05, y: -5 }}
//             whileTap={{ scale: 0.95 }}
//             className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
//           >
//             <div className="flex items-center justify-between mb-4">
//               <FaHeart className="text-3xl" />
//               <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
//                 <span className="text-xl">↑</span>
//               </div>
//             </div>
//             <p className="text-sm opacity-90 font-medium">Tickets Resolved</p>
//             <h2 className="text-3xl font-bold mt-1">{closedTickets.length}</h2>
//           </motion.div>
//           <motion.div
//             whileHover={{ scale: 1.05, y: -5 }}
//             whileTap={{ scale: 0.95 }}
//             className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
//           >
//             <div className="flex items-center justify-between mb-4">
//               <FaDollarSign className="text-3xl" />
//               <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
//                 <span className="text-xl">↑</span>
//               </div>
//             </div>
//             <p className="text-sm opacity-90 font-medium">Total Order</p>
//             <h2 className="text-3xl font-bold mt-1">{ordersTotal}</h2>
//           </motion.div>
//           <motion.div
//             whileHover={{ scale: 1.05, y: -5 }}
//             whileTap={{ scale: 0.95 }}
//             className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
//           >
//             <div className="flex items-center justify-between mb-4">
//               <FaUsers className="text-3xl" />
//               <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
//                 <span className="text-xl">↑</span>
//               </div>
//             </div>
//             <p className="text-sm opacity-90 font-medium">New Members</p>
//             <h2 className="text-3xl font-bold mt-1">{usersTotal}</h2>
//           </motion.div>
//         </div>
 
//         {/* ===== MONTHLY REPORT ===== */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.2, duration: 0.6 }}
//           className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8"
//         >
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold text-gray-800">Monthly Recap Report</h2>
//             <div className="flex space-x-2">
//               <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
//               <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//               <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
//             </div>
//           </div>
 
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//             <div className="lg:col-span-2">
//               <MonthlyReportChart />
//             </div>
 
//             <div className="space-y-6">
//               {[
//                 { label: "Add to Cart", percent: "80%", color: "bg-gradient-to-r from-blue-500 to-blue-600" },
//                 { label: "Complete Purchase", percent: "75%", color: "bg-gradient-to-r from-green-500 to-emerald-600" },
//                 { label: "Visit Premium Page", percent: "60%", color: "bg-gradient-to-r from-purple-500 to-indigo-600" },
//                 { label: "Send Inquiries", percent: "50%", color: "bg-gradient-to-r from-orange-500 to-red-500" },
//               ].map((g, i) => (
//                 <motion.div
//                   key={i}
//                   initial={{ opacity: 0, x: 20 }}
//                   animate={{ opacity: 1, x: 0 }}
//                   transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
//                   className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
//                 >
//                   <div className="flex justify-between items-center mb-2">
//                     <span className="font-medium text-gray-700">{g.label}</span>
//                     <span className="text-sm font-bold text-gray-600">{g.percent}</span>
//                   </div>
//                   <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
//                     <motion.div
//                       initial={{ width: 0 }}
//                       animate={{ width: g.percent }}
//                       transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
//                       className={`h-full ${g.color} rounded-full`}
//                     />
//                   </div>
//                 </motion.div>
//               ))}
//             </div>
//           </div>
//         </motion.div>
 
//         {/* ===== USERS & ORDERS ===== */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 
//           {/* Latest Members */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.4, duration: 0.6 }}
//             className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-6"
//           >
//             <div className="flex items-center justify-between mb-6">
//               <h3 className="text-xl font-bold text-gray-800">Latest Members</h3>
//               <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
//                 <span className="text-white text-sm">👥</span>
//               </div>
//             </div>
 
//             <div className="grid grid-cols-4 gap-4">
//               {users.map((user, i) => (
//                 <motion.div
//                   key={user.id}
//                   whileHover={{ scale: 1.1 }}
//                   className="text-center group"
//                 >
//                   <div className="relative">
//                     <img
//                       src={user.avatar_url || "/cs-assets/assets/img/user1-128x128.jpg"}
//                       className="w-14 h-14 rounded-full mx-auto border-2 border-white shadow-lg group-hover:shadow-xl transition-shadow"
//                       alt={user.name}
//                     />
//                     <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
//                   </div>
//                   <p className="text-xs mt-2 font-medium text-gray-600 truncate">{user.name}</p>
//                 </motion.div>
//               ))}
//               {users.length === 0 && <div className="col-span-4 text-center text-gray-400">No members</div>}
//             </div>
 
//             <Link
//               to="/cs/user-list"
//               className="block text-center mt-6 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition-all no-underline duration-300 shadow-lg hover:shadow-xl"
//             >
//               View All Users →
//             </Link>
//           </motion.div>
 
//           {/* Latest Orders */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.5, duration: 0.6 }}
//             className="lg:col-span-2 bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-6"
//           >
//             <div className="flex items-center justify-between mb-6">
//               <h3 className="text-xl font-bold text-gray-800">Latest Orders</h3>
//               <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
//                 <span className="text-white text-sm">📦</span>
//               </div>
//             </div>
                            
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead>
//                   <tr className="border-b border-gray-200">
//                     <th className="text-left py-3 font-semibold text-gray-700">Order</th>
//                     <th className="text-left font-semibold text-gray-700">Item</th>
//                     <th className="font-semibold text-gray-700">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {orders.map((order, i) => (
//                     <motion.tr
//                       key={order.id}
//                       initial={{ opacity: 0, y: 10 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
//                       className="border-b border-gray-100 last:border-none hover:bg-gray-50 transition-colors"
//                     >
//                       <td className="py-4 text-blue-600 font-medium hover:text-blue-800 transition-colors">#{order.order_id}</td>
//                       <td className="py-4 text-gray-700">{order.template_name}</td>
//                       <td className="py-4">
//                         <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
//                           {order.status}
//                         </span>
//                       </td>
//                     </motion.tr>
//                   ))}
//                   {orders.length === 0 && (
//                     <tr><td colSpan={3} className="text-center text-gray-400 py-4">No orders</td></tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
 
//             <Link
//               to="/cs/orders"
//               className="inline-block mt-6 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-300 no-underline shadow-lg hover:shadow-xl"
//             >
//               View All Orders →
//             </Link>
//           </motion.div>
//         </div>
//       </motion.div>
//     </MainLayout>
//   );
// }


import MainLayout from "./MainLayout";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiMessageCircle, FiClock, FiCheckCircle, FiShoppingBag } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
 

const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    totalTickets: 0,
    resolved: 0,
    open: 0,
    inProgress: 0,
  });
  const [openTickets, setOpenTickets] = useState([]);
  const [closedTickets, setClosedTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("cs_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch tickets from CS API
      const ticketsRes = await fetch(`${API_URL}/cs/tickets.php`, {
        headers,
        credentials: "include",
      });
      const ticketsData = await ticketsRes.json();
      if (ticketsData.success) {
        const allTickets = ticketsData.tickets || [];
        const open = allTickets.filter((t) => t.status === "OPEN" || t.status === "ASSIGNED" || t.status === "IN_PROGRESS");
        const closed = allTickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED");
        setMetrics({
          totalTickets: allTickets.length,
          resolved: closed.length,
          open: open.length,
          inProgress: allTickets.filter((t) => t.status === "IN_PROGRESS").length,
        });
        setOpenTickets(open.slice(0, 5));
        setClosedTickets(closed.slice(0, 5));
      }

      // Fetch orders with user details from CS API
      try {
        const ordersRes = await fetch(`${API_URL}/cs/orders.php`, {
          headers,
          credentials: "include",
        });
        const ordersData = await ordersRes.json();
        if (ordersData.success) {
          const allOrders = ordersData.orders || [];
          setOrdersTotal(allOrders.length);
          setOrders(allOrders.slice(0, 10));
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      }

      // Fetch latest users for dashboard
      try {
        const usersRes = await fetch(`${API_URL}/cs/users.php?page=1&per_page=8`, {
          headers,
          credentials: "include",
        });
        const usersData = await usersRes.json();
        if (usersData.success) {
          setUsers(usersData.users || []);
          setUsersTotal(usersData.meta?.total || (usersData.users || []).length);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }

    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="min-h-screen space-y-5 rounded-3xl bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-3 sm:space-y-6 sm:p-5 lg:p-8"
      >
        {/* ===== HEADER ===== */}
        <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm shadow-emerald-900/5 sm:p-5 lg:bg-transparent lg:p-0 lg:shadow-none lg:border-0">
          <h1 className="mb-1 text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">Support Dashboard</h1>
          <p className="text-sm text-gray-600 sm:text-base">Manage and track support tickets</p>
        </div>
 
        {/* ===== STAT CARDS ===== */}
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <motion.div
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white shadow-lg transition-all duration-300 hover:shadow-xl sm:p-5 lg:p-6"
          >
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <FiMessageCircle className="text-2xl sm:text-3xl" />
            </div>
            <p className="text-sm opacity-90 font-medium">Total Tickets</p>
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{metrics.totalTickets}</h2>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-2xl bg-gradient-to-r from-green-500 to-green-600 p-4 text-white shadow-lg transition-all duration-300 hover:shadow-xl sm:p-5 lg:p-6"
            style={{ background: "linear-gradient(135deg, #04733c 0%, #035a2f 100%)" }}
          >
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <FiMessageCircle className="text-2xl sm:text-3xl" />
            </div>
            <p className="text-sm opacity-90 font-medium">Open Tickets</p>
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{metrics.open}</h2>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 p-4 text-white shadow-lg transition-all duration-300 hover:shadow-xl sm:p-5 lg:p-6"
          >
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <FiCheckCircle className="text-2xl sm:text-3xl" />
            </div>
            <p className="text-sm opacity-90 font-medium">Resolved Tickets</p>
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{metrics.resolved}</h2>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 p-4 text-white shadow-lg transition-all duration-300 hover:shadow-xl sm:p-5 lg:p-6"
          >
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <FiShoppingBag className="text-2xl sm:text-3xl" />
            </div>
            <p className="text-sm opacity-90 font-medium">New Members</p>
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{usersTotal}</h2>
          </motion.div>
        </div>
 

        {/* ===== TICKETS SECTIONS ===== */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          {/* Open Tickets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-xl shadow-emerald-900/5 backdrop-blur-lg sm:rounded-3xl sm:p-6"
          >
            <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 sm:text-xl">
                <FiMessageCircle className="text-green-600" />
                Open Tickets ({openTickets.length})
              </h3>
              <Link
                to="/cs/ticket"
                className="text-sm text-green-600 hover:text-green-700 font-semibold"
              >
                View All →
              </Link>
            </div>
            <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
              {openTickets.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No open tickets</div>
              ) : (
                openTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => navigate(`/cs/ticketdetails/${ticket.id}`)}
                    className="cursor-pointer rounded-xl border border-gray-200 bg-gray-50 p-3 transition-colors hover:bg-gray-100 sm:p-4"
                  >
                    <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h4 className="min-w-0 break-words font-semibold text-gray-800">{ticket.subject}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          ticket.created_by_role === 'SELLER' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {ticket.created_by_role || 'USER'}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ticket.status === "OPEN" ? "bg-blue-100 text-blue-800" :
                        ticket.status === "ASSIGNED" ? "bg-yellow-100 text-yellow-800" :
                        "bg-purple-100 text-purple-800"
                      }`}>
                        {ticket.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ticket.message || "No description"}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 sm:gap-4">
                      <div className="flex items-center gap-1">
                        <span>{ticket.creator_name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                      {ticket.priority && (
                        <span className={`px-2 py-0.5 rounded ${
                          ticket.priority === "URGENT" ? "bg-red-100 text-red-800" :
                          ticket.priority === "HIGH" ? "bg-orange-100 text-orange-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {ticket.priority}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Closed Tickets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-xl shadow-emerald-900/5 backdrop-blur-lg sm:rounded-3xl sm:p-6"
          >
            <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 sm:text-xl">
                <FiCheckCircle className="text-green-600" />
                Closed Tickets ({closedTickets.length})
              </h3>
              <Link
                to="/cs/ticket"
                className="text-sm text-green-600 hover:text-green-700 font-semibold"
              >
                View All →
              </Link>
            </div>
            <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
              {closedTickets.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No closed tickets</div>
              ) : (
                closedTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => navigate(`/cs/ticketdetails/${ticket.id}`)}
                    className="cursor-pointer rounded-xl border border-gray-200 bg-gray-50 p-3 transition-colors hover:bg-gray-100 sm:p-4"
                  >
                    <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h4 className="min-w-0 break-words font-semibold text-gray-800">{ticket.subject}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          ticket.created_by_role === 'SELLER' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {ticket.created_by_role || 'USER'}
                        </span>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ticket.message || "No description"}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 sm:gap-4">
                      <div className="flex items-center gap-1">
                        <span>{ticket.creator_name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* ===== RECENT ORDERS (Simplified) ===== */}
        {orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-md sm:p-6"
          >
            <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 sm:text-xl">
                <FiShoppingBag className="text-green-600" />
                Recent Orders
              </h3>
              <span className="text-sm text-gray-600">Total: {ordersTotal}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 font-semibold text-gray-700">Order ID</th>
                    <th className="text-left font-semibold text-gray-700">Customer</th>
                    <th className="text-left font-semibold text-gray-700">Product</th>
                    <th className="text-left font-semibold text-gray-700">Amount</th>
                    <th className="text-left font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-100 last:border-none hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 text-blue-600 font-medium">
                        #{String(order.id).padStart(6, "0")}
                      </td>
                      <td className="py-3">
                        <div className="font-medium text-gray-800">{order.user_name || "Unknown"}</div>
                        <div className="text-xs text-gray-500">{order.user_email}</div>
                      </td>
                      <td className="py-3 text-gray-800">{order.product_name || "N/A"}</td>
                      <td className="py-3 font-semibold text-gray-800">
                        ₹{parseFloat(order.amount || 0).toFixed(2)}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === "completed" ? "bg-green-100 text-green-800" :
                          order.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {order.status || "Unknown"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </motion.div>
    </MainLayout>
  );
}


