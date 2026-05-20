import { useState, useEffect } from "react";
import MainLayout from "../components/MainLayout";
import { FiCheckCircle, FiSearch, FiDollarSign, FiLoader, FiFilter, FiUser, FiBriefcase } from "react-icons/fi";

const statusStyles = {
  Paid: "bg-green-100 text-green-700",
  completed: "bg-green-100 text-green-700",
  Refunded: "bg-red-100 text-red-700",
  cancelled: "bg-red-100 text-red-700",
  Hold: "bg-yellow-100 text-yellow-700",
  pending: "bg-yellow-100 text-yellow-700",
};

export default function PaymentStatus() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tempStatus, setTempStatus] = useState({});
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
  const ADMIN_API_URL = `${API_URL}/admin`;

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_API_URL}/orders.php`, {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (data.success && data.orders) {
        // Transform orders to payments format, including seller info if available
        const paymentsData = await Promise.all(data.orders.map(async (order) => {
          // Check if product has seller_id
          let sellerInfo = null;
          if (order.product_id) {
            try {
              const productRes = await fetch(`${ADMIN_API_URL}/products.php?id=${order.product_id}`, {
                credentials: 'include'
              });
              const productData = await productRes.json();
              if (productData.success && productData.product?.seller_id) {
                // Fetch seller info
                const sellerRes = await fetch(`${ADMIN_API_URL}/sellers.php?id=${productData.product.seller_id}`, {
                  credentials: 'include'
                });
                const sellerData = await sellerRes.json();
                if (sellerData.success && sellerData.seller) {
                  sellerInfo = sellerData.seller;
                }
              }
            } catch (err) {
              console.error('Error fetching seller info:', err);
            }
          }

          return {
            id: `PAY-${String(order.id).padStart(6, '0')}`,
            orderId: order.id,
            customer: order.customer_name || 'Unknown User',
            customerEmail: order.customer_email || 'N/A',
            seller: sellerInfo ? (sellerInfo.business_name || sellerInfo.email) : null,
            sellerId: sellerInfo?.id || null,
            amount: `₹${parseFloat(order.amount || 0).toFixed(2)}`,
            method: order.payment_method || 'Card',
            status: order.status === 'completed' ? 'Paid' : order.status === 'cancelled' ? 'Refunded' : 'Hold',
            originalStatus: order.status,
            date: new Date(order.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }),
            productName: order.product_name || 'N/A'
          };
        }));
        
        setPayments(paymentsData);
      }
    } catch (err) {
      console.error('Fetch payments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const handleSelectChange = (id, value) => {
    setTempStatus((prev) => ({ ...prev, [id]: value }));
  };

  const saveStatus = async (payment) => {
    const newStatus = tempStatus[payment.id];
    if (!newStatus) return;

    // Map payment status back to order status
    const orderStatusMap = {
      'Paid': 'completed',
      'Refunded': 'cancelled',
      'Hold': 'pending'
    };
    const orderStatus = orderStatusMap[newStatus] || payment.originalStatus;

    try {
      const res = await fetch(`${ADMIN_API_URL}/orders.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: payment.orderId, status: orderStatus })
      });
      
      const data = await res.json();
      if (data.success) {
        setPayments((prev) =>
          prev.map((p) => (p.id === payment.id ? { ...p, status: newStatus, originalStatus: orderStatus } : p))
        );
        setTempStatus((prev) => {
          const updated = { ...prev };
          delete updated[payment.id];
          return updated;
        });
        showToast("Status updated successfully!");
      } else {
        showToast("Failed to update status");
      }
    } catch (err) {
      console.error('Update status error:', err);
      showToast("Error updating status");
    }
  };

  const filteredPayments = payments.filter(
    (p) =>
      (p.customer || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.customerEmail || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.seller || "").toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      String(p.orderId).includes(search)
  );

  return (
    <MainLayout>
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-5 right-5 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-toast flex items-center gap-2">
          <FiCheckCircle className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
            <FiDollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Payment Status</h2>
            <p className="text-gray-500 mt-1">Monitor and manage payment transactions</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by payment ID or customer name..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <FiFilter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">{filteredPayments.length} Payments</span>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Customer / Seller</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Method</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Change</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Save</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <FiLoader className="w-12 h-12 text-gray-400 animate-spin mb-4" />
                      <p className="text-gray-500">Loading payments...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <FiDollarSign className="w-16 h-16 text-gray-300 mb-4" />
                      <p className="text-lg font-medium text-gray-500">No payments found</p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-green-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">{p.id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">#{p.orderId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                          <FiUser className="w-4 h-4 text-blue-600" />
                          {p.customer}
                        </div>
                        <div className="text-xs text-gray-500">{p.customerEmail}</div>
                        {p.seller && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                            <FiBriefcase className="w-3 h-3 text-green-600" />
                            <span className="font-medium">Seller: {p.seller}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 max-w-xs truncate" title={p.productName}>
                        {p.productName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">{p.amount}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{p.method}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusStyles[p.status] || 'bg-gray-100 text-gray-700'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={tempStatus[p.id] ?? p.status}
                        onChange={(e) => handleSelectChange(p.id, e.target.value)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white"
                      >
                        <option value="Paid">Paid</option>
                        <option value="Refunded">Refunded</option>
                        <option value="Hold">Hold</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => saveStatus(p)}
                        title="Save updated status"
                        className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-600 hover:text-white transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                      >
                        <FiCheckCircle size={18} />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {filteredPayments.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredPayments.length}</span> of <span className="font-semibold">{filteredPayments.length}</span> payments
          </p>
        </div>
      )}

      {/* ANIMATIONS */}
      <style>{`
        @keyframes toastSlide {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-toast {
          animation: toastSlide 0.3s ease-out;
        }
      `}</style>
    </MainLayout>
  );
}
