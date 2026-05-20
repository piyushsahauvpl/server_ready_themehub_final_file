import MainLayout from "../components/MainLayout";
import {
  FiMessageCircle,
  FiLoader,
  FiCheck,
  FiX,
  FiSend,
  FiX as FiClose,
} from "react-icons/fi";
import { useState, useEffect } from "react";
 
export default function SellerApproval() {
  const [pendingSellers, setPendingSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingSeller, setRejectingSeller] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);
 
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://uptulathemehub.com/backend/api";
  const ADMIN_API_URL = `${API_URL}/admin`;
 
  /* ===============================
     FETCH PENDING SELLERS
     =============================== */
  useEffect(() => {
    fetchPendingSellers();
  }, []);
 
  const fetchPendingSellers = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch(`${ADMIN_API_URL}/seller-approval.php`, {
        credentials: "include",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
 
      if (data.success) {
        setPendingSellers(data.sellers || []);
      } else {
        setError(data.message || "Failed to load sellers");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Server error while loading sellers");
    } finally {
      setLoading(false);
    }
  };
 
  /* ===============================
     ACTIONS
     =============================== */
  const handleViewDetails = (seller) => {
    setSelectedSeller(seller);
    setShowDetailsModal(true);
    setPaymentMessage("");
  };
 
  const handleApproveSeller = async (seller) => {
    if (!window.confirm(`Approve seller: ${seller.full_name}?`)) return;
 
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${ADMIN_API_URL}/approve-seller.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ seller_id: seller.id }),
      });
 
      const data = await res.json();
      if (data.success) {
        fetchPendingSellers();
      } else {
        alert(data.message || "Failed to approve seller");
      }
    } catch (err) {
      console.error("Approve error:", err);
      alert("Error approving seller");
    }
  };
 
  const handleRejectSeller = async (seller) => {
    setRejectingSeller(seller);
    setShowRejectModal(true);
    setRejectReason("");
  };
 
  const confirmRejectSeller = async () => {
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
 
    setIsRejecting(true);
    try {
      // Try JSON first (normal case)
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${ADMIN_API_URL}/reject-seller.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          seller_id: rejectingSeller.id,
          rejection_reason: rejectReason,
        }),
      });
 
      if (!res.ok) {
        // Try to parse body if available, otherwise throw to trigger fallback
        let parsed = null;
        try {
          parsed = await res.json();
        } catch (e) {
          throw new Error(`HTTP ${res.status}`);
        }
 
        if (parsed && parsed.success) {
          alert(`Seller rejected successfully. Notification sent.`);
          setShowRejectModal(false);
          setRejectReason("");
          setRejectingSeller(null);
          fetchPendingSellers();
          return;
        }
 
        alert(parsed?.message || `Failed to reject seller (HTTP ${res.status})`);
        return;
      }
 
      const data = await res.json();
      if (data.success) {
        alert(`Seller rejected successfully. Notification sent.`);
        setShowRejectModal(false);
        setRejectReason("");
        setRejectingSeller(null);
        fetchPendingSellers();
      } else {
        alert(data.message || "Failed to reject seller");
      }
    } catch (err) {
      console.error("Reject error (first attempt):", err);
 
      // Fallback: some servers reject JSON preflight/CORS; try sending as FormData
      try {
        const form = new FormData();
        form.append("seller_id", rejectingSeller.id);
        form.append("rejection_reason", rejectReason);
 
        const token = localStorage.getItem('auth_token');
        const res2 = await fetch(`${ADMIN_API_URL}/reject-seller.php`, {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: form,
        });
 
        if (!res2.ok) {
          let txt = "";
          try {
            const j = await res2.json();
            txt = j.message || `HTTP ${res2.status}`;
          } catch (e) {
            txt = `HTTP ${res2.status}`;
          }
          alert(`Failed to reject seller: ${txt}`);
          return;
        }
 
        const data2 = await res2.json();
        if (data2.success) {
          alert(`Seller rejected successfully. Notification sent.`);
          setShowRejectModal(false);
          setRejectReason("");
          setRejectingSeller(null);
          fetchPendingSellers();
        } else {
          alert(data2.message || "Failed to reject seller");
        }
      } catch (err2) {
        console.error("Reject error (fallback):", err2);
        alert("Network error rejecting seller. Check server/CORS.");
      }
    } finally {
      setIsRejecting(false);
    }
  };
 
  const handleSendPaymentMessage = async () => {
    if (!paymentMessage.trim()) return;
 
    setSendingMessage(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${ADMIN_API_URL}/send-seller-message.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          seller_id: selectedSeller.id,
          message: paymentMessage,
          message_type: "payment_approval",
        }),
      });
 
      const data = await res.json();
      if (data.success) {
        setShowDetailsModal(false);
        fetchPendingSellers();
      } else {
        alert(data.message || "Failed to send message");
      }
    } catch (err) {
      console.error("Message error:", err);
      alert("Error sending message");
    } finally {
      setSendingMessage(false);
    }
  };
 
  /* ===============================
     LOADING STATE
     =============================== */
  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-screen">
          <FiLoader className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </MainLayout>
    );
  }
 
  return (
    <MainLayout>
      {/* HEADER */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-3 bg-green-600 rounded-xl">
          <FiMessageCircle className="text-white w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl text-black font-bold">Seller Approval</h2>
          <p className="text-gray-500">
            {pendingSellers.length} seller
            {pendingSellers.length !== 1 && "s"} pending approval
          </p>
        </div>
      </div>
 
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}
 
      {pendingSellers.length === 0 ? (
        <div className="p-8 bg-gray-50 rounded text-black text-center">
          No sellers pending approval
        </div>
      ) : (
        <div className="space-y-4">
          {pendingSellers.map((seller) => (
            <div
              key={seller.id}
              className="bg-gradient-to-r from-white to-gray-50 border border-gray-100 rounded-2xl p-6 flex items-center justify-between shadow-md hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="flex-none">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-white flex items-center justify-center text-xl font-bold shadow-lg">
                    {seller.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                </div>
 
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold text-gray-900 truncate">
                    {seller.full_name}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">{seller.email}</p>
 
                  <div className="mt-2 text-sm text-gray-600 grid grid-cols-2 gap-x-4 gap-y-1">
                    <div>
                      <span className="text-gray-400">Business: </span>
                      <span className="font-medium">{seller.business_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Category: </span>
                      <span className="font-medium">{seller.business_category}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Phone: </span>
                      <span className="font-medium">{seller.phone}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Applied: </span>
                      <span className="font-medium">{new Date(seller.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
 
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => handleViewDetails(seller)}
                  className="w-14 h-14 rounded-lg bg-white border border-blue-600 text-blue-600 flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
                  title="View"
                >
                  View
                </button>
 
                <button
                  onClick={() => handleApproveSeller(seller)}
                  className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform"
                  title="Approve"
                >
                  <FiCheck />
                </button>
 
                <button
                  onClick={() => handleRejectSeller(seller)}
                  className="w-14 h-14 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform"
                  title="Reject"
                >
                  <FiX />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
 
      {/* MODAL */}
      {showDetailsModal && selectedSeller && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden">
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white">
              <div>
                <h3 className="font-bold text-lg">Seller Details</h3>
                <p className="text-sm opacity-90">{selectedSeller.full_name}</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="p-2 rounded-md hover:bg-white/10">
                <FiClose size={22} />
              </button>
            </div>
 
            <div className="p-6 space-y-4 bg-white">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{selectedSeller.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedSeller.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Business</p>
                  <p className="font-medium">{selectedSeller.business_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium">{selectedSeller.business_category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{selectedSeller.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Applied</p>
                  <p className="font-medium">{new Date(selectedSeller.created_at).toLocaleDateString()}</p>
                </div>
              </div>
 
              {selectedSeller.business_description && (
                <div className="bg-gray-50 p-4 rounded-lg">{selectedSeller.business_description}</div>
              )}
 
              <textarea
                value={paymentMessage}
                onChange={(e) => setPaymentMessage(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={4}
                placeholder="Payment instructions..."
              />
 
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={handleSendPaymentMessage}
                  disabled={sendingMessage}
                  className="px-4 py-2 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-lg shadow-md disabled:opacity-50"
                >
                  {sendingMessage ? "Sending..." : "Send Message"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
 
      {/* REJECTION MODAL */}
      {showRejectModal && rejectingSeller && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl ring-1 ring-black/5 overflow-hidden">
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-red-600 to-rose-600 text-white">
              <div>
                <h3 className="font-bold text-lg">Reject Seller</h3>
                <p className="text-sm opacity-90">{rejectingSeller.full_name}</p>
              </div>
              <button onClick={() => setShowRejectModal(false)} className="p-2 rounded-md hover:bg-white/10">
                <FiClose size={22} />
              </button>
            </div>
 
            <div className="p-6 space-y-4 bg-white">
              <p className="text-gray-700">
                <b>Seller:</b> {rejectingSeller.full_name}
              </p>
              <p className="text-gray-600 text-sm">
                Please provide a reason for rejection. The seller will be notified.
              </p>
 
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                rows={5}
                placeholder="Enter rejection reason (required)..."
              />
 
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  disabled={isRejecting}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRejectSeller}
                  disabled={isRejecting || !rejectReason.trim()}
                  className="px-4 py-2 bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-lg shadow-md disabled:opacity-50"
                >
                  {isRejecting ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
 
 
 