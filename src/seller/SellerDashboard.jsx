import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPackage,
  FiShoppingBag,
  FiBarChart2,
  FiMessageCircle,
  FiArrowRight,
  FiRefreshCw,
} from 'react-icons/fi';
import { BiRupee } from 'react-icons/bi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import DynamicPurchaseHistory from '../components/DynamicPurchaseHistory';

export default function SellerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { label: 'Total Earnings', value: '₹0.00', icon: <BiRupee /> },
    { label: 'Pending Earnings', value: '₹0.00', icon: <BiRupee /> },
    { label: 'Approved Products', value: '0', icon: <FiPackage /> },
    { label: 'Total Sales', value: '0', icon: <FiShoppingBag /> },
  ]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [approvedProducts, setApprovedProducts] = useState(0);
  const [purchases, setPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const seller = {
    business_name: 'ThemeHub Seller',
  };

  // Refresh dashboard data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
      
      // Fetch earnings data
      const res = await fetch(`${API_URL}/seller/earnings.php`, {
        credentials: 'include'
      });
      const data = await res.json();

      // Fetch approved products count
      const approvedRes = await fetch(`${API_URL}/seller/approved-products.php`, {
        credentials: 'include'
      });
      const approvedData = await approvedRes.json();

      console.log('🔄 Dashboard Refreshed - Approved:', approvedData.approved_count);

      if (data.success && data.seller) {
        const approvedCount = approvedData?.approved_count || 0;
        const totalSales = data.monthly_sales?.reduce((sum, m) => sum + (m.order_count || 0), 0) || 0;

        setStats([
          { label: 'Total Earnings', value: `₹${data.seller.total_earnings.toFixed(2)}`, icon: <BiRupee /> },
          { label: 'Pending Earnings', value: `₹${data.seller.pending_earnings.toFixed(2)}`, icon: <BiRupee /> },
          { label: 'Approved Products', value: `${approvedCount}`, icon: <FiPackage /> },
          { label: 'Total Sales', value: `${totalSales}`, icon: <FiShoppingBag /> },
        ]);

        setApprovedProducts(approvedCount);
      }
    } catch (err) {
      console.error('❌ Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch purchase history
  const fetchPurchases = async () => {
    try {
      setPurchasesLoading(true);
      const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
      
      const res = await fetch(`${API_URL}/orders.php`, {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (data.success && data.orders) {
        setPurchases(data.orders);
      } else if (data.success && data.purchases) {
        setPurchases(data.purchases);
      } else {
        setPurchases([]);
      }
    } catch (err) {
      console.error('Error fetching purchases:', err);
      setPurchases([]);
    } finally {
      setPurchasesLoading(false);
    }
  };

  // Fetch earnings data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
        
        // ✅ STEP 1: Fetch earnings data
        console.log('📊 Fetching earnings from:', `${API_URL}/seller/earnings.php`);
        
        const res = await fetch(`${API_URL}/seller/earnings.php`, {
          credentials: 'include'
        });

        console.log('📊 Earnings response status:', res.status);

        if (!res.ok) {
          throw new Error(`Earnings API returned ${res.status}`);
        }

        const data = await res.json();

        console.log('📊 Dashboard - Earnings data:', data);

        // ✅ STEP 2: Fetch approved products count with detailed logging
        console.log('📦 Fetching approved products from:', `${API_URL}/seller/approved-products.php`);

        const approvedRes = await fetch(`${API_URL}/seller/approved-products.php`, {
          credentials: 'include'
        });

        console.log('📦 Approved response status:', approvedRes.status);

        if (!approvedRes.ok) {
          throw new Error(`Approved products API returned ${approvedRes.status}`);
        }

        const approvedData = await approvedRes.json();

        console.log('📦 Dashboard - Approved products data:', approvedData);

        if (data.success && data.seller) {
          const approvedCount = approvedData?.approved_count || 0;
          const totalSales = data.monthly_sales?.reduce((sum, m) => sum + (m.order_count || 0), 0) || 0;

          console.log('✅ Setting stats with approved count:', approvedCount);

          // Update stats with real data
          setStats([
            { label: 'Total Earnings', value: `₹${data.seller.total_earnings.toFixed(2)}`, icon: <BiRupee /> },
            { label: 'Pending Earnings', value: `₹${data.seller.pending_earnings.toFixed(2)}`, icon: <BiRupee /> },
            { label: 'Approved Products', value: `${approvedCount}`, icon: <FiPackage /> },
            { label: 'Total Sales', value: `${totalSales}`, icon: <FiShoppingBag /> },
          ]);

          setApprovedProducts(approvedCount);

          // Format monthly sales data for chart
          if (data.monthly_sales && Array.isArray(data.monthly_sales)) {
            const chartData = data.monthly_sales.map(m => ({
              month: m.month.substring(5), // Extract MM from YYYY-MM
              orders: m.order_count,
              earnings: m.total_earnings,
            }));
            setMonthlySales(chartData);
          }
        } else {
          console.warn('⚠️ Dashboard - Invalid data response:', data);
        }

        // ✅ STEP 3: Fetch purchase history
        await fetchPurchases();
      } catch (err) {
        console.error('❌ Dashboard - Error fetching data:', err);
        setPurchases([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-gray-100 px-6 py-3 space-y-4">

      {/* ================= HEADER ================= */}
      <div className="bg-white rounded-xl px-6 py-2 border flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold">Your Dashboard</h1>
          </div>

          {/* profile card removed from dashboard - moved to profile dropdown */}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
            title="Refresh dashboard data"
          >
            <FiRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {!refreshing && 'Refresh'}
          </button>
{/*           
          <button
            onClick={() => navigate('/seller/wallet')}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900"
          >
            View Wallet
          </button> */}

          <button
            onClick={() => navigate('/seller/products/add')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* ================= METRICS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-white border rounded-xl px-4 py-4 flex justify-between items-center"
          >
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
            <div className="text-2xl text-green-600">{s.icon}</div>
          </div>
        ))}
      </div>

      {/* ================= SALES + PURCHASE ================= */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Monthly Sales */}
        <div className="bg-white border rounded-xl px-5 py-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Monthly Sales (Last 12 Months)</h3>
            <FiBarChart2 className="text-green-600" />
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Loading chart...</p>
            </div>
          ) : monthlySales.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis yAxisId="left" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" fontSize={12} />
                <Tooltip 
                  formatter={(value) => value.toString()}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="orders" fill="#10b981" name="Orders" />
                <Bar yAxisId="right" dataKey="earnings" fill="#3b82f6" name="Earnings (₹)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No sales data yet</p>
              <button
                onClick={() => navigate('/seller/products/add')}
                className="mt-3 border border-green-600 text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 text-sm"
              >
                Upload your first product
              </button>
            </div>
          )}
        </div>

        {/* Purchase History */}
        <div className="bg-white border rounded-xl px-5 py-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Purchase History</h3>
            <button
              onClick={() => navigate('/seller/purchases')}
              className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1"
            >
              View All
              <FiArrowRight className="w-4 h-4" />
            </button>
          </div>

          <DynamicPurchaseHistory 
            purchases={purchases} 
            loading={purchasesLoading}
            onRefresh={fetchPurchases}
            variant="compact"
          />
        </div>
      </div>

      {/* ================= QUICK ACTIONS ================= */}
      <div className="bg-white border rounded-xl px-5 py-3">
        <h3 className="font-semibold mb-3">Quick Actions</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Action
            title="Products"
            icon={<FiPackage />}
            onClick={() => navigate('/seller/products')}
          />
          <Action
            title="Earnings"
            icon={<BiRupee />}
            onClick={() => navigate('/seller/earnings')}
          />
          <Action
            title="Analytics"
            icon={<FiBarChart2 />}
            onClick={() => navigate('/seller/analytics')}
          />
          <Action
            title="Support"
            icon={<FiMessageCircle />}
            onClick={() => navigate('/support/tickets')}
          />
        </div>
      </div>
    </div>
  );
}

/* ================= ACTION COMPONENT ================= */

function Action({ title, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="border rounded-xl px-4 py-3 flex items-center gap-2 hover:bg-green-50 transition text-sm"
    >
      <span className="text-green-600 text-lg">{icon}</span>
      <span className="font-medium">{title}</span>
    </button>
  );
}
