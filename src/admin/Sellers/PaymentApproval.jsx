import MainLayout from "../components/MainLayout";
import { FiCreditCard, FiLoader, FiCheck, FiX, FiSearch, FiEye, FiDownload } from "react-icons/fi";
import { useState, useEffect } from "react";
 
export default function PaymentApproval() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
 
  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
  const ADMIN_API_URL = `${API_URL}/admin`;
  const formatAmount = (amount, currency) => {
    const symbol = currency && currency !== "$" ? currency : "₹";
    return `${symbol}${parseFloat(amount || 0).toFixed(2)}`;
  };
 
  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);
 
  const fetchPayments = async () => {
    setLoading(true);
    setError("");
    try {
      const url = new URL(`${ADMIN_API_URL}/payments.php`);
      if (statusFilter) url.searchParams.append("status", statusFilter);
 
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
 
      if (data.success && data.payments) {
        setPayments(data.payments);
      } else {
        setError(data.message || "Failed to load payments");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Error loading payments");
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search !== undefined) {
        fetchPayments();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);
 
  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };
 
  const handleApprovePayment = async (paymentId) => {
    if (!window.confirm("Approve this payment?")) return;
 
    try {
      const res = await fetch(`${ADMIN_API_URL}/approve-payment.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ payment_id: paymentId }),
      });
 
      const data = await res.json();
      if (data.success) {
        alert("Payment approved successfully!");
        fetchPayments();
      } else {
        alert(data.message || "Failed to approve payment");
      }
    } catch (err) {
      console.error("Approve error:", err);
      alert("Error approving payment");
    }
  };
 
  const handleRejectPayment = async (paymentId) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
 
    try {
      const res = await fetch(`${ADMIN_API_URL}/reject-payment.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ payment_id: paymentId, reason }),
      });
 
      const data = await res.json();
      if (data.success) {
        alert("Payment rejected successfully!");
        fetchPayments();
      } else {
        alert(data.message || "Failed to reject payment");
      }
    } catch (err) {
      console.error("Reject error:", err);
      alert("Error rejecting payment");
    }
  };
 
  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      completed: "bg-blue-100 text-blue-700",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
  };
 
  const filteredPayments = payments.filter((p) =>
    (p.seller_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.seller_email || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.transaction_id || "").toLowerCase().includes(search.toLowerCase())
  );
 
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <FiLoader className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </MainLayout>
    );
  }
 
  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
            <FiCreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Payment Approval</h2>
            <p className="text-gray-500 mt-1">
              {filteredPayments.length} payment{filteredPayments.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>
 
      {/* Filters and Search */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by seller name, email, or transaction ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>
      </div>
 
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
 
      {filteredPayments.length === 0 ? (
        <div className="p-8 bg-gray-50 rounded-lg text-center border border-gray-200">
          <p className="text-gray-600">No payments found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Seller</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Transaction ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{payment.seller_name}</p>
                      <p className="text-sm text-gray-600">{payment.seller_email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                      {payment.transaction_id}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">
                      {formatAmount(payment.amount, payment.currency)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(payment.status)}`}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(payment)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-1 text-sm"
                        title="View Details"
                      >
                        <FiEye size={14} />
                        View
                      </button>
                      {payment.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprovePayment(payment.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1 text-sm"
                            title="Approve"
                          >
                            <FiCheck size={14} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectPayment(payment.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-1 text-sm"
                            title="Reject"
                          >
                            <FiX size={14} />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
 
      {/* Payment Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 p-6 flex items-center justify-between text-white">
              <h3 className="text-xl font-bold">Payment Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="hover:bg-green-800 p-2 rounded transition"
              >
                <FiX size={24} />
              </button>
            </div>
 
            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Seller Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">{selectedPayment.seller_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{selectedPayment.seller_email}</p>
                  </div>
                </div>
              </div>
 
              {/* Payment Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Transaction ID</p>
                    <code className="font-mono text-gray-900 font-semibold break-all">{selectedPayment.transaction_id}</code>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-semibold text-gray-900">
                      {formatAmount(selectedPayment.amount, selectedPayment.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedPayment.status)}`}>
                      {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-semibold text-gray-900">
                      {selectedPayment.payment_method ? selectedPayment.payment_method.charAt(0).toUpperCase() + selectedPayment.payment_method.slice(1) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedPayment.created_at).toLocaleString()}
                    </p>
                  </div>
                  {selectedPayment.approved_at && (
                    <div>
                      <p className="text-sm text-gray-600">Approved Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedPayment.approved_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
 
              {/* Additional Details */}
              {selectedPayment.notes && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Notes</h4>
                  <p className="text-gray-700 p-3 bg-gray-50 rounded">
                    {selectedPayment.notes}
                  </p>
                </div>
              )}
 
              {/* Action Buttons */}
              <div className="flex gap-3 justify-end border-t pt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Close
                </button>
                {selectedPayment.status === "pending" && (
                  <>
                    <button
                      onClick={() => {
                        handleApprovePayment(selectedPayment.id);
                        setShowDetailsModal(false);
                      }}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                    >
                      <FiCheck size={16} />
                      Approve Payment
                    </button>
                    <button
                      onClick={() => {
                        handleRejectPayment(selectedPayment.id);
                        setShowDetailsModal(false);
                      }}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                    >
                      <FiX size={16} />
                      Reject Payment
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
 
 
