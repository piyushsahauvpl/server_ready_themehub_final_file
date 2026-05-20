import React, { useState, useEffect } from 'react';
import { getPendingEarnings, postApproveEarnings } from '../lib/apiClient';

const EarningsApproval = () => {
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEarnings, setSelectedEarnings] = useState([]);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const response = await getPendingEarnings();
      if (response.success) {
        setEarnings(response.earnings);
      } else {
        setError(response.message || 'Failed to load earnings');
      }
    } catch (err) {
      setError('Error loading earnings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEarning = (earningId) => {
    setSelectedEarnings(prev =>
      prev.includes(earningId)
        ? prev.filter(id => id !== earningId)
        : [...prev, earningId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEarnings.length === earnings.length) {
      setSelectedEarnings([]);
    } else {
      setSelectedEarnings(earnings.map(e => e.id));
    }
  };

  const handleApprove = async () => {
    if (selectedEarnings.length === 0) return;

    try {
      setApproving(true);
      const response = await postApproveEarnings(selectedEarnings);
      if (response.success) {
        alert(`Approved ${response.approved.length} earnings`);
        setSelectedEarnings([]);
        fetchEarnings(); // Refresh the list
      } else {
        setError(response.message || 'Failed to approve earnings');
      }
    } catch (err) {
      setError('Error approving earnings');
      console.error(err);
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading pending earnings...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Earnings Approval</h1>
        <div className="text-sm text-gray-600">
          Total Pending: {earnings.length}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {earnings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No pending earnings to approve</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center space-x-4">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              {selectedEarnings.length === earnings.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={handleApprove}
              disabled={selectedEarnings.length === 0 || approving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {approving ? 'Approving...' : `Approve Selected (${selectedEarnings.length})`}
            </button>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {earnings.map((earning) => (
                <li key={earning.id} className="px-6 py-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedEarnings.includes(earning.id)}
                      onChange={() => handleSelectEarning(earning.id)}
                      className="mr-4"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {earning.seller_name || earning.seller_email}
                          </p>
                          <p className="text-sm text-gray-500">
                            Order #{earning.order_id} - {earning.product_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-green-600">
                            ₹{parseFloat(earning.amount).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(earning.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Commission: {earning.commission_rate}% | Order Amount: ₹{parseFloat(earning.order_amount).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default EarningsApproval;