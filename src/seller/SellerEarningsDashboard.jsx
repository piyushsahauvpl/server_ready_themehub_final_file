import React, { useState, useEffect } from 'react';
import { FiDownload, FiAlertCircle, FiDollarSign, FiTrendingDown } from 'react-icons/fi';

export default function SellerEarningsDashboard() {
  const [earnings, setEarnings] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

  useEffect(() => {
    fetchEarningsData();
  }, [selectedMonth]);

  const fetchEarningsData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/seller-earnings.php?month=${selectedMonth}`,
        {
          credentials: 'include'
        }
      );

      const data = await response.json();

      if (data.success) {
        setEarnings(data.earnings);
        setTransactions(data.transactions || []);
      } else {
        alert('Failed to fetch earnings data');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Failed to fetch earnings data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!transactions.length) {
      alert('No data to export');
      return;
    }

    const headers = ['Date', 'Type', 'Amount', 'Description', 'Refund ID'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(t =>
        `${new Date(t.created_at).toLocaleDateString()},${t.transaction_type},₹${t.amount},${t.description},${t.refund_id}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings-${selectedMonth}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="text-center py-8">Loading earnings data...</div>;
  }

  if (!earnings) {
    return <div className="text-center py-8">No earnings data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Earnings & Refunds</h1>
        
        <div className="flex gap-4">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          
          <button
            onClick={exportToCSV}
            disabled={!transactions.length}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <FiDownload className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Earnings Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Sales</p>
              <p className="text-2xl font-bold text-green-700">
                ₹{earnings.total_sales?.toFixed(2) || '0.00'}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {/* Refund Deductions */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Refund Deductions</p>
              <p className="text-2xl font-bold text-red-700">
                -₹{(earnings.refund_deductions || 0).toFixed(2)}
              </p>
              <p className="text-xs text-red-600 mt-1">
                {earnings.refund_count || 0} refunds
              </p>
            </div>
            <FiTrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>

        {/* Net Earnings */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Net Earnings</p>
              <p className="text-2xl font-bold text-blue-700">
                ₹{(earnings.net_earnings || 0).toFixed(2)}
              </p>
            </div>
            <FiDollarSign className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {/* Commission */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Commission</p>
              <p className="text-2xl font-bold text-purple-700">
                -₹{(earnings.commission || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Refund Impact Warning */}
      {(earnings.refund_deductions || 0) > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex gap-4">
          <FiAlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-900">Refund Impact</h3>
            <p className="text-sm text-orange-800 mt-1">
              Your earnings have been reduced by ₹{(earnings.refund_deductions || 0).toFixed(2)} due to refunds approved this month.
              This amount will be deducted from your wallet balance. Review transactions below for details.
            </p>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Detailed Transactions</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Refund ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No transactions for this month
                  </td>
                </tr>
              ) : (
                transactions.map((transaction, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {new Date(transaction.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        transaction.transaction_type === 'deduction'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {transaction.transaction_type === 'deduction' ? 'Deduction' : 'Adjustment'}
                      </span>
                    </td>
                    <td className={`px-6 py-3 text-sm font-semibold ${
                      transaction.transaction_type === 'deduction' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transaction.transaction_type === 'deduction' ? '-' : '+'}₹{transaction.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">
                      {transaction.refund_id ? `#${transaction.refund_id}` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Icon component
function DollarSign(props) {
  return <FiDollarSign {...props} />;
}
