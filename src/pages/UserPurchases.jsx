import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiLoader, FiShoppingBag } from 'react-icons/fi';
import DynamicPurchaseHistory from '../components/DynamicPurchaseHistory';

export default function UserPurchases() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

  const loadPurchases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`${API_URL}/purchases.php`, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success && data.purchases) {
        setPurchases(data.purchases);
      } else if (data.success && data.orders) {
        setPurchases(data.orders);
      } else {
        setPurchases([]);
      }
    } catch (err) {
      console.error('Error loading purchases:', err);
      setError('Failed to load purchase history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Go back"
          >
            <FiArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase History</h1>
            <p className="text-gray-600 mt-2">
              View all products downloaded and payments made
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
            <button
              onClick={loadPurchases}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center gap-2 mb-6">
            <FiShoppingBag className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-semibold text-gray-900">
              Your Purchases
            </h2>
          </div>

          <DynamicPurchaseHistory
            purchases={purchases}
            loading={loading}
            onRefresh={loadPurchases}
            variant="full"
          />
        </div>
      </div>
    </div>
  );
}
