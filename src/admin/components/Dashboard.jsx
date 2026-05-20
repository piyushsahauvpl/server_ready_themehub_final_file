import MainLayout from "./MainLayout";
import OverviewCard from "./OverviewCard";
 
import TopCategoriesChart from "./TopCategoriesChart";
import FrameworkDonutChart from "./FrameworkDonutChart";
import CustomerChart from "./CustomerChart";
import RevenueChart from "./RevenueChart";
 
import { FiArrowUpRight, FiArrowDownRight } from "react-icons/fi";
import { useEffect, useState } from "react";
import { getAdminWalletSummary } from "../../lib/apiClient";

export default function Dashboard() {
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0, revenue: 0 });
  const [dashboardData, setDashboardData] = useState(null);
  const [walletSummary, setWalletSummary] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
        const ADMIN_API_URL = `${API_URL}/admin`;
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${ADMIN_API_URL}/dashboard.php`, {
          credentials: "include",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json();
       
        if (data.success) {
          setStats(data.stats);
          setDashboardData(data);
        }
      } catch (err) {
        console.error('Dashboard fetch error', err);
      }
    };

    const fetchWalletData = async () => {
      try {
        setWalletLoading(true);
        console.log('Fetching wallet summary...');
        const response = await getAdminWalletSummary();
        console.log('Wallet API response:', response);
        if (response && response.success) {
          console.log('Setting wallet summary:', response.summary);
          setWalletSummary(response.summary);
        } else {
          console.warn('Wallet API returned success=false or invalid response', response);
        }
      } catch (err) {
        console.error('Wallet summary fetch error details:', {
          message: err.message,
          status: err.status,
          body: err.body,
          stack: err.stack
        });
      } finally {
        setWalletLoading(false);
      }
    };
   
    fetchDashboardData();
    fetchWalletData();
  }, []);
 
  const fmt = (n) => n ? n.toLocaleString() : '0';
  const fmtCurrency = (n) => {
    try {
      return n ? '\u20B9' + Number(n).toLocaleString() : '\u20B9' + '0.00';
    } catch (e) { return '\u20B9' + '0.00'; }
  };
 
  return (
    <MainLayout>
      <div className="space-y-5">
 
        {/* ================= TOP SECTION ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
 
          {/* LEFT: 4 OVERVIEW CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 place-items-center lg:col-span-3">
            <div className="w-full max-w-xs"><OverviewCard title="Total Users" value={fmt(stats.users)} color="#22C55E" /></div>
            <div className="w-full max-w-xs"><OverviewCard title="Total Products" value={fmt(stats.products)} color="#3B82F6" /></div>
            <div className="w-full max-w-xs"><OverviewCard title="Total Orders" value={fmt(stats.orders)} color="#10B981" /></div>
            <div className="w-full max-w-xs"><OverviewCard title="Total Revenue" value={fmtCurrency(stats.revenue)} color="#F97316" meta={`Orders: ${fmt(stats.orders)}`} /></div>
          </div>

          {/* WALLET OVERVIEW CARDS */}
          {!walletLoading && walletSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 place-items-center lg:col-span-3 mt-6">
              <div className="w-full max-w-xs">
                <OverviewCard 
                  title="Platform Balance" 
                  value={fmtCurrency(walletSummary.total_platform_balance)} 
                  color="#8B5CF6" 
                  meta="Commission earned"
                />
              </div>
              <div className="w-full max-w-xs">
                <OverviewCard 
                  title="Seller Wallets" 
                  value={fmtCurrency(walletSummary.total_seller_wallet_balance)} 
                  color="#06B6D4" 
                  meta={`${walletSummary.active_sellers} active sellers`}
                />
              </div>
              <div className="w-full max-w-xs">
                <OverviewCard 
                  title="Total Withdrawn" 
                  value={fmtCurrency(walletSummary.total_withdrawn_amount)} 
                  color="#F59E0B" 
                  meta="Processed payouts"
                />
              </div>
              <div className="w-full max-w-xs">
                <OverviewCard 
                  title="Pending Withdrawals" 
                  value={fmtCurrency(walletSummary.total_pending_withdrawals)} 
                  color="#EF4444" 
                  meta={`${walletSummary.sellers_with_pending_withdrawals} sellers waiting`}
                />
              </div>
            </div>
          )}

          {/* RIGHT: VISITORS + GROWTH */}
          <div className="flex flex-col gap-3">
 
            {/* WEBSITE VISITORS */}
            {/* <div className="bg-gradient-to-r from-green-500 to-indigo-600 px-4 py-3 rounded-xl text-white shadow-sm">
              <p className="text-xs uppercase tracking-wide opacity-80">
                Website Visitors
              </p>
 
              <div className="flex items-end justify-between mt-2">
                <h2 className="text-xl font-bold">32,100</h2>
                <span className="text-xs text-green-200 flex items-center gap-1">
                  ▲ 18%
                </span>
              </div>
 
              <p className="text-[11px] opacity-80 mt-1">
                This month
              </p>
            </div> */}
 
            {/* GROWTH ANALYTICS */}
            {/* <div className="bg-white px-4 py-3 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-800">
                  Growth Analytics
                </h3>
                <span className="text-xs text-gray-400">
                  This month
                </span>
              </div>
 
              <div className="grid grid-cols-3 gap-2">
                <MiniGrowth label="Users" value="+15%" meta={fmt(stats.users)} positive />
                <MiniGrowth label="Orders" value="+8%" meta={fmt(stats.orders)} positive />
                <MiniGrowth
                  label="Revenue"
                  value="-3%"
                  meta={fmtCurrency(stats.revenue)}
                  positive={false}
                />
              </div>
            </div> */}
 
          </div>
        </div>

        {/* ================= WALLET MANAGEMENT QUICK LINKS ================= */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallet Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/admin/wallet-dashboard"
              className="flex items-center p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white hover:from-purple-600 hover:to-purple-700 transition-all"
            >
              <div className="flex-1">
                <h4 className="font-medium">Wallet Dashboard</h4>
                <p className="text-sm opacity-90">Complete wallet overview</p>
              </div>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </a>

            <a
              href="/admin/seller-wallets"
              className="flex items-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              <div className="flex-1">
                <h4 className="font-medium">Seller Wallets</h4>
                <p className="text-sm opacity-90">Manage seller balances</p>
              </div>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </a>

            <a
              href="/admin/withdraw-requests"
              className="flex items-center p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              <div className="flex-1">
                <h4 className="font-medium">Withdraw Requests</h4>
                <p className="text-sm opacity-90">Process payouts</p>
              </div>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </a>

            <a
              href="/admin/earnings-approval"
              className="flex items-center p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white hover:from-green-600 hover:to-green-700 transition-all"
            >
              <div className="flex-1">
                <h4 className="font-medium">Earnings Approval</h4>
                <p className="text-sm opacity-90">Approve seller earnings</p>
              </div>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </a>
          </div>
        </div>

        {/* ================= ANALYTICS ROW (HORIZONTAL 4 CARDS) ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
 
          <RevenueChart data={dashboardData?.revenueData} />
 
          <CustomerChart data={dashboardData?.customerGrowth} />
 
          <TopCategoriesChart data={dashboardData?.topCategories} />
 
          <FrameworkDonutChart data={dashboardData?.popularFrameworks} />
 
        </div>
 
      </div>
    </MainLayout>
  );
}
 
/* ================= MINI GROWTH CARD ================= */
 
function MiniGrowth({ label, value, meta, positive }) {
  return (
    <div className="bg-gray-50 rounded-lg px-2.5 py-2 hover:shadow-sm transition">
      <p className="text-[11px] text-gray-500">
        {label}
      </p>
 
      <div className="flex items-center justify-between mt-1">
        <span className="text-sm font-semibold text-gray-800">
          {value}
        </span>
 
        {positive ? (
          <FiArrowUpRight size={14} className="text-green-600" />
        ) : (
          <FiArrowDownRight size={14} className="text-red-500" />
        )}
      </div>
 
      <p className="text-[11px] text-gray-400 mt-0.5">
        {meta}
      </p>
    </div>
  );
}
 
 