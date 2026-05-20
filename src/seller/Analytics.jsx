import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiBarChart2, 
  FiLoader, 
  FiAlertCircle,
  FiArrowLeft,
  FiTrendingUp,
  FiPackage,
  FiArrowRight
} from 'react-icons/fi';
import { BiRupee } from 'react-icons/bi';

export default function Analytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

  useEffect(() => {
    fetchAnalytics();
  }, []);
  // Removed seller/check-auth.php check, now relies only on user session

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_URL}/seller/earnings.php`, {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (data.success) {
        setAnalytics(data);
      } else {
        setError(data.message || 'Failed to load analytics');
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('Error loading analytics');
    } finally {
      setLoading(false);
    }
  };

  const fmtCurrency = (n) => {
    return n ? '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '₹0.00';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium"
              style={{ 
                backgroundColor: '#f0fdf4',
                color: '#04733c',
                border: '1px solid #04733c'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#04733c';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateX(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f0fdf4';
                e.currentTarget.style.color = '#04733c';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <FiArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <FiLoader className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading analytics...</p>
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Monthly Sales Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiBarChart2 className="w-5 h-5 text-green-600" />
                Monthly Sales (Last 12 Months)
              </h2>
              {analytics.monthly_sales && analytics.monthly_sales.length > 0 ? (
                <div className="space-y-3">
                  {analytics.monthly_sales.map((sale, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">{sale.month}</p>
                        <p className="text-sm text-gray-500">{sale.order_count} orders</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{fmtCurrency(sale.total_earnings)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No sales data available</p>
              )}
            </div>

            {/* Product Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiPackage className="w-5 h-5 text-green-600" />
                Product Performance
              </h2>
              {analytics.product_performance && analytics.product_performance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Price</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Sales</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Revenue</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Rating</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Reviews</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {analytics.product_performance.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{fmtCurrency(product.price)}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{product.sales_count || 0}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600">{fmtCurrency(product.total_revenue || 0)}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                            {product.avg_rating ? parseFloat(product.avg_rating).toFixed(1) : 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{product.review_count || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No product performance data available</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <FiBarChart2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No analytics data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
