import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiLoader, 
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiTrendingUp
} from 'react-icons/fi';
import { BiRupee } from 'react-icons/bi';

export default function Earnings() {
  const navigate = useNavigate();
  const [earnings, setEarnings] = useState([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

  useEffect(() => {
    fetchEarnings();
  }, []);
  // Removed seller/check-auth.php check, now relies only on user session

  const fetchEarnings = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_URL}/seller/earnings.php`, {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (data.success) {
        setEarnings(data.recent_earnings || []);
        
        // Set stats from seller data
        setStats({
          totalEarnings: data.seller?.total_earnings || 0,
          pendingEarnings: data.seller?.pending_earnings || 0,
          paidEarnings: data.seller?.paid_earnings || 0
        });
      } else {
        setError(data.message || 'Failed to load earnings');
      }
    } catch (err) {
      console.error('Earnings fetch error:', err);
      setError('Error loading earnings');
    } finally {
      setLoading(false);
    }
  };

  const fmtCurrency = (n) => {
    return n ? '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '₹0.00';
  };

  const getStatusBadge = (status) => {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          <FiCheckCircle className="w-3 h-3" />
          Paid
        </span>
      );
    } else if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
          <FiClock className="w-3 h-3" />
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
        {status}
      </span>
    );
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
            <h1 className="text-2xl font-bold text-gray-900">My Earnings</h1>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">{fmtCurrency(stats.totalEarnings)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <BiRupee className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Paid</p>
                <p className="text-2xl font-bold text-green-600">{fmtCurrency(stats.paidEarnings)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{fmtCurrency(stats.pendingEarnings)}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FiClock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Earnings History</h2>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <FiLoader className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
              <p className="text-gray-500">Loading earnings...</p>
            </div>
          ) : earnings.length === 0 ? (
            <div className="text-center py-16">
              <BiRupee className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No earnings yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {earnings.map((earning) => (
                    <tr key={earning.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(earning.order_date || earning.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {earning.product_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {fmtCurrency(earning.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {earning.commission_rate}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(earning.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
