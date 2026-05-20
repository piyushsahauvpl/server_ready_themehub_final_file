import MainLayout from "../components/MainLayout";
import { FiUsers, FiSearch, FiEye, FiLoader, FiStar, FiTrash2, FiDollarSign, FiCheckCircle } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminSellerPayoutDetails, postAdminProcessSellerPayout } from "../../lib/apiClient";

export default function SellerList() {
  const [sellers, setSellers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(null);
  const [payoutModal, setPayoutModal] = useState(null);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
  const ADMIN_API_URL = `${API_URL}/admin`;

  useEffect(() => {
    fetchSellers();
  }, [statusFilter]);

  const fetchSellers = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const url = new URL(`${ADMIN_API_URL}/sellers.php`);
      if (search) url.searchParams.append("search", search);
      if (statusFilter) url.searchParams.append("status", statusFilter);

      const token = localStorage.getItem('auth_token');
      const res = await fetch(url, {
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();

      if (data.success && data.sellers) {
        setSellers(data.sellers);
      } else {
        setError(data.message || "Failed to load sellers");
      }
    } catch (err) {
      console.error("Sellers fetch error", err);
      setError("Error loading sellers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search !== undefined) fetchSellers();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const updateSeller = async (sellerId, updates) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${ADMIN_API_URL}/sellers.php`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ id: sellerId, ...updates }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSellers();
      } else {
        setError(data.message || "Failed to update seller");
      }
    } catch (err) {
      console.error("Update seller error", err);
      setError("Error updating seller");
    }
  };

  const openPayoutModal = async (seller) => {
    const sellerId = Number(seller?.id || 0);
    if (!sellerId) {
      setError("Invalid seller selected for payout.");
      return;
    }

    setError("");
    setSuccess("");
    setDetailsLoading(true);
    try {
      const data = await getAdminSellerPayoutDetails(sellerId);
      if (data && data.success) {
        setPayoutModal({
          seller: data.seller,
          bankDetails: data.bank_details,
          pendingAmount: data.pending_amount,
          payableAmount: data.payable_amount,
          earnings: data.earnings
        });
      } else {
        setError(data.message || "Unable to load payout details.");
      }
    } catch (err) {
      console.error("Fetch payout details error", err);
      setError(err.message || "Error loading payout details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const processPayout = async () => {
    if (!payoutModal?.seller?.seller_id) {
      setError("No payout data available.");
      return;
    }

    const sellerId = payoutModal.seller.seller_id;
    const payoutAmount = payoutModal.payableAmount;

    // Confirm payout with admin
    if (!window.confirm(`Process payout of ₹${parseFloat(payoutAmount).toFixed(2)} to ${payoutModal.seller.full_name}?\n\nAccount: ${payoutModal.bankDetails?.account_number || 'Not set'}`)) {
      return;
    }

    setPaymentLoading(sellerId);
    setError("");
    setSuccess("");
    
    try {
      console.log(`[PAYOUT] Initiating payout for seller ${sellerId}: ₹${payoutAmount}`);
      
      const data = await postAdminProcessSellerPayout(sellerId);
      
      console.log("[PAYOUT] Response:", data);
      
      if (data && data.success) {
        setSuccess(`✅ ${data.message || "Payout of ₹" + parseFloat(payoutAmount).toFixed(2) + " sent successfully!"}`);
        setTimeout(() => {
          setPayoutModal(null);
          fetchSellers();
        }, 2000);
      } else {
        const errorMsg = data?.message || "Failed to process payout - backend returned no error message";
        console.error("[PAYOUT ERROR]", errorMsg);
        setError(`❌ Payout failed: ${errorMsg}`);
      }
    } catch (err) {
      console.error("[PAYOUT EXCEPTION]", err);
      setError(`❌ Error processing payout: ${err.message || "Unknown error occurred"}`);
      
      // Show detailed error to admin
      if (err.response) {
        console.error("Response status:", err.response.status);
        console.error("Response body:", err.response.body);
      }
    } finally {
      setPaymentLoading(null);
    }
  };

  const deleteSeller = async (sellerId, sellerName, businessName) => {
    if (!window.confirm(`Are you sure you want to delete this seller?\n\nName: ${sellerName}\nBusiness: ${businessName || "N/A"}`)) return;
    const deleteUser = window.confirm("Do you also want to delete the associated user account?");

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${ADMIN_API_URL}/sellers.php`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ id: sellerId, delete_user: deleteUser }),
      });
      const data = await res.json();
      if (data.success) {
        setSellers((prev) => prev.filter((s) => s.id !== sellerId));
      } else {
        setError(data.message || "Failed to delete seller");
      }
    } catch (err) {
      console.error("Delete seller error", err);
      setError("Error deleting seller");
    }
  };

  const getBadgeColor = (badge) => {
    switch (badge) {
      case "elite": return "bg-purple-100 text-purple-700";
      case "rising_star": return "bg-blue-100 text-blue-700";
      case "new_author": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getBadgeLabel = (badge) => {
    switch (badge) {
      case "elite": return "Elite";
      case "rising_star": return "Rising Star";
      case "new_author": return "New Author";
      default: return "None";
    }
  };

  const filteredSellers = sellers.filter(
    (s) =>
      (s.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.business_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
            <FiUsers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Seller Management</h2>
            <p className="text-gray-500 mt-1">Manage authors and sellers</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, or business..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              onChange={(e) => setSearch(e.target.value)}
              value={search}
            />
          </div>
          <select
            className="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-emerald-800">{success}</p>
        </div>
      )}

      {/* Sellers Table */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
        {loading ? (
          <div className="text-center py-16">
            <FiLoader className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading sellers...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Seller</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Business</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Products</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Earnings</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSellers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <FiUsers className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-lg font-medium text-gray-500">No sellers found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSellers.map((seller) => (
                    <tr key={seller.id} className="hover:bg-green-50 transition-colors duration-150">
                      {/* Seller */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-700 font-semibold">
                              {seller.full_name?.charAt(0) || "S"}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{seller.full_name}</div>
                            <div className="text-xs text-gray-500">{seller.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Business */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">{seller.business_name || "N/A"}</div>
                        {seller.badge && seller.badge !== "none" && (
                          <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${getBadgeColor(seller.badge)}`}>
                            {getBadgeLabel(seller.badge)}
                          </span>
                        )}
                      </td>

                      {/* Rating */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-semibold">{parseFloat(seller.average_rating || 0).toFixed(1)}</span>
                          <span className="text-xs text-gray-500">({seller.total_reviews || 0})</span>
                        </div>
                      </td>

                      {/* Products */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          <span className="font-semibold">{seller.approved_products || 0}</span> / {seller.total_products || 0}
                        </div>
                      </td>

                      {/* Earnings */}
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-semibold text-gray-900">₹{parseFloat(seller.total_earnings || 0).toFixed(2)}</div>
                          <div className="text-xs text-gray-500">Pending: ₹{parseFloat(seller.pending_earnings || 0).toFixed(2)}</div>
                        </div>
                      </td>

                      {/* ── Payment Status Column ── */}
                      <td className="px-6 py-4">
                        {Number(seller.pending_earnings || 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            <FiDollarSign className="w-3.5 h-3.5" />
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            <FiCheckCircle className="w-3.5 h-3.5" />
                            Paid
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          className={`px-3 py-1.5 text-xs font-semibold rounded-full border-0 cursor-pointer ${
                            seller.status === "active"
                              ? "bg-green-100 text-green-700"
                              : seller.status === "suspended"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                          value={seller.status}
                          onChange={(e) => updateSeller(seller.id, { status: e.target.value })}
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>

                      {/* ── Actions Column ── */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center items-center gap-2">
                          {/* View */}
                          <button
                            onClick={() => navigate(`/admin/seller-approval?seller_id=${seller.id}`)}
                            className="p-2 hover:bg-green-100 rounded-lg transition text-green-600"
                            title="View Details"
                          >
                            <FiEye size={18} />
                          </button>

                          {/* ── Payment Approve Button ── */}
                          {Number(seller.pending_earnings || 0) > 0 ? (
                            <button
                              onClick={() => openPayoutModal(seller)}
                              disabled={paymentLoading === seller.id || detailsLoading}
                              className="p-2 hover:bg-emerald-100 rounded-lg transition text-emerald-600 disabled:opacity-40"
                              title="Approve Pending Earnings"
                            >
                              {paymentLoading === seller.id ? (
                                <FiLoader size={18} className="animate-spin" />
                              ) : (
                                <FiCheckCircle size={18} />
                              )}
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-2 rounded-lg text-green-400 cursor-not-allowed opacity-60"
                              title="Payment Already Approved"
                            >
                              <FiCheckCircle size={18} />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => deleteSeller(seller.id, seller.full_name, seller.business_name)}
                            className="p-2 hover:bg-red-50 rounded-lg transition text-red-600"
                            title="Delete Seller"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Payout Modal ─────────────────────────────────────── */}
      {payoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-100">
                  <FiDollarSign className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Pay Seller Now</h3>
                  <p className="text-sm text-gray-500">Review bank details and approve the payout.</p>
                </div>
              </div>
              <button
                onClick={() => setPayoutModal(null)}
                className="text-gray-400 hover:text-gray-600"
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 mb-4 md:grid-cols-2">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Seller</p>
                <p className="font-semibold text-gray-900">{payoutModal.seller.full_name}</p>
                <p className="text-sm text-gray-500">{payoutModal.seller.email}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Business</p>
                <p className="font-semibold text-gray-900">{payoutModal.seller.business_name || 'N/A'}</p>
                <p className="text-sm text-gray-500">Payable ₹{parseFloat(payoutModal.payableAmount || 0).toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 md:col-span-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Pending Amount (DB)</p>
                <p className="font-semibold text-gray-900">₹{parseFloat(payoutModal.pendingAmount || 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="grid gap-4 mb-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase tracking-wide">Account Holder</label>
                <input type="text" readOnly value={payoutModal.bankDetails?.account_holder || ''} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase tracking-wide">Account Number</label>
                <input type="text" readOnly value={payoutModal.bankDetails?.account_number || ''} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase tracking-wide">IFSC</label>
                <input type="text" readOnly value={payoutModal.bankDetails?.ifsc_code || ''} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase tracking-wide">Bank Name</label>
                <input type="text" readOnly value={payoutModal.bankDetails?.bank_name || ''} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900" />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
              <p className="text-sm text-blue-900">
                <strong>💳 Payout Method:</strong> This will transfer funds via RazorpayX to the seller's bank account listed above.
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Amount: <strong>₹{parseFloat(payoutModal.payableAmount || 0).toFixed(2)}</strong>
              </p>
              <p className="text-xs text-blue-700 mt-2">
                <strong>⚠️  Note:</strong> Ensure you have sufficient balance in your RazorpayX account before processing the payout.
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Check the browser console (F12) for detailed error logs if the payment fails.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setPayoutModal(null)}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={processPayout}
                disabled={paymentLoading || detailsLoading}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paymentLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <FiLoader className="h-4 w-4 animate-spin" /> Processing
                  </span>
                ) : (
                  'Pay Now'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}