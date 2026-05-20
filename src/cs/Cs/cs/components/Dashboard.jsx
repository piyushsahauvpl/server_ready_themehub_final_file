import MainLayout from "./MainLayout";
import MonthlyReportChart from "./MonthlyReportChart";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaChartLine, FaHeart, FaDollarSign, FaUsers } from "react-icons/fa";
import { useEffect, useState } from "react";
import axios from "axios";
 

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    totalTickets: 0,
    resolved: 0,
    avgResponseTime: "0 min",
    satisfaction: "0%",
  });
  const [orders, setOrders] = useState([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  useEffect(() => {
    fetchTicketMetrics();
    fetchOrders();
    fetchUsers();
  }, []);

  const fetchTicketMetrics = async () => {
    try {
      const metricsRes = await fetch(
        "https://uptulathemehub.com/backend/api/tickets.php?action=metrics",
        { credentials: "include" }
      );
      const metricsData = await metricsRes.json();
      if (metricsData.success) setMetrics(metricsData.metrics);
    } catch (err) {}
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get(
        "https://uptulathemehub.com/backend/api/cs/orders.php?page=1&per_page=3",
        { withCredentials: true }
      );
      if (res.data.success) {
        setOrdersTotal(res.data.meta?.total || 0);
        setOrders(res.data.data || []);
      }
    } catch (err) {}
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        "https://uptulathemehub.com/backend/api/cs/users.php?page=1&per_page=8",
        { withCredentials: true }
      );
      if (res.data.success) {
        setUsers(res.data.users || []);
        setUsersTotal(res.data.meta?.total || 0);
      }
    } catch (err) {}
  };

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="p-8 space-y-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen"
      >
        {/* ===== HEADER ===== */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your business today.</p>
        </div>
 
        {/* ===== STAT CARDS ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <FaChartLine className="text-3xl" />
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xl">↑</span>
              </div>
            </div>
            <p className="text-sm opacity-90 font-medium">Total Tickets</p>
            <h2 className="text-3xl font-bold mt-1">{metrics.totalTickets}</h2>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <FaHeart className="text-3xl" />
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xl">↑</span>
              </div>
            </div>
            <p className="text-sm opacity-90 font-medium">Tickets Resolved</p>
            <h2 className="text-3xl font-bold mt-1">{metrics.resolved}</h2>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <FaDollarSign className="text-3xl" />
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xl">↑</span>
              </div>
            </div>
            <p className="text-sm opacity-90 font-medium">Total Order</p>
            <h2 className="text-3xl font-bold mt-1">{ordersTotal}</h2>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <FaUsers className="text-3xl" />
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xl">↑</span>
              </div>
            </div>
            <p className="text-sm opacity-90 font-medium">New Members</p>
            <h2 className="text-3xl font-bold mt-1">{usersTotal}</h2>
          </motion.div>
        </div>
 
        {/* ===== MONTHLY REPORT ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Monthly Recap Report</h2>
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            </div>
          </div>
 
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <MonthlyReportChart />
            </div>
 
            <div className="space-y-6">
              {[
                { label: "Add to Cart", percent: "80%", color: "bg-gradient-to-r from-blue-500 to-blue-600" },
                { label: "Complete Purchase", percent: "75%", color: "bg-gradient-to-r from-green-500 to-emerald-600" },
                { label: "Visit Premium Page", percent: "60%", color: "bg-gradient-to-r from-purple-500 to-indigo-600" },
                { label: "Send Inquiries", percent: "50%", color: "bg-gradient-to-r from-orange-500 to-red-500" },
              ].map((g, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">{g.label}</span>
                    <span className="text-sm font-bold text-gray-600">{g.percent}</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: g.percent }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                      className={`h-full ${g.color} rounded-full`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
 
        {/* ===== USERS & ORDERS ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 
          {/* Latest Members */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Latest Members</h3>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">👥</span>
              </div>
            </div>
 
            <div className="grid grid-cols-4 gap-4">
              {users.map((user, i) => (
                <motion.div
                  key={user.id}
                  whileHover={{ scale: 1.1 }}
                  className="text-center group"
                >
                  <div className="relative">
                    <img
                      src={user.avatar_url || "/cs-assets/assets/img/user1-128x128.jpg"}
                      className="w-14 h-14 rounded-full mx-auto border-2 border-white shadow-lg group-hover:shadow-xl transition-shadow"
                      alt={user.name}
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <p className="text-xs mt-2 font-medium text-gray-600 truncate">{user.name}</p>
                </motion.div>
              ))}
              {users.length === 0 && <div className="col-span-4 text-center text-gray-400">No members</div>}
            </div>
 
            <Link
              to="/cs/user-list"
              className="block text-center mt-6 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition-all no-underline duration-300 shadow-lg hover:shadow-xl"
            >
              View All Users →
            </Link>
          </motion.div>
 
          {/* Latest Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="lg:col-span-2 bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Latest Orders</h3>
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📦</span>
              </div>
            </div>
                            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 font-semibold text-gray-700">Order</th>
                    <th className="text-left font-semibold text-gray-700">Item</th>
                    <th className="font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
                      className="border-b border-gray-100 last:border-none hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 text-blue-600 font-medium hover:text-blue-800 transition-colors">#{order.order_id}</td>
                      <td className="py-4 text-gray-700">{order.template_name}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                          {order.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={3} className="text-center text-gray-400 py-4">No orders</td></tr>
                  )}
                </tbody>
              </table>
            </div>
 
            <Link
              to="/cs/orders"
              className="inline-block mt-6 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-300 no-underline shadow-lg hover:shadow-xl"
            >
              View All Orders →
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </MainLayout>
  );
}

