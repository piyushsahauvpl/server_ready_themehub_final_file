import { useState, useEffect } from "react";
import { FiMessageCircle, FiLoader, FiCheck, FiX, FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
 
export default function SellerMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
 
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
 
  useEffect(() => {
    fetchMessages();
  }, []);
 
  const fetchMessages = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/seller/seller-message.php`, {
        credentials: "include",
      });
      const data = await res.json();
 
      if (data.success && data.messages) {
        setMessages(data.messages);
      } else {
        setError(data.message || "Failed to load messages");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Error loading messages");
    } finally {
      setLoading(false);
    }
  };
 
  const handleConfirmPayment = async (messageId) => {
    if (!window.confirm("Confirm that you have completed the payment?")) return;
 
    setConfirmingPayment(true);
    try {
      const res = await fetch(`${API_URL}/seller/confirm-seller-payment.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message_id: messageId }),
      });
 
      const data = await res.json();
      if (data.success) {
        alert("Payment confirmed! Your profile has been upgraded to a seller account. Please reload to see your new seller dashboard.");
        setPaymentConfirmed(true);
        // Reload page to reflect profile changes
        setTimeout(() => window.location.reload(), 1500);
      } else {
        alert(data.message || "Failed to confirm payment");
      }
    } catch (err) {
      console.error("Confirm error:", err);
      alert("Error confirming payment");
    } finally {
      setConfirmingPayment(false);
    }
  };
 
  const markAsRead = async (messageId) => {
    try {
      await fetch(`${API_URL}/seller/mark-message-read.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message_id: messageId }),
      });
      fetchMessages();
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };
 
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <FiLoader className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 mb-4"
          >
            <FiArrowLeft size={20} />
            Go Back
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <FiMessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
              <p className="text-gray-500 mt-1">
                {messages.length} message{messages.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
 
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
 
        {paymentConfirmed && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
            <FiCheck size={20} />
            Payment confirmed successfully!
          </div>
        )}
 
        {messages.length === 0 ? (
          <div className="p-8 bg-white rounded-lg text-center border border-gray-200">
            <p className="text-gray-600">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-6 rounded-lg border transition cursor-pointer ${
                  msg.is_read
                    ? "bg-white border-gray-200"
                    : "bg-blue-50 border-blue-200 ring-2 ring-blue-300"
                }`}
                onClick={() => {
                  setSelectedMessage(msg);
                  if (!msg.is_read) markAsRead(msg.id);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {msg.message_type === "payment_approval"
                          ? "Payment Approval"
                          : "Message"}
                      </h3>
                      {!msg.is_read && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      From: Admin | {new Date(msg.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-gray-700 mt-3 line-clamp-2">
                      {msg.message}
                    </p>
                  </div>
                  {msg.message_type === "payment_approval" && (
                    <div className="ml-4">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full font-medium">
                        Payment Required
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
 
        {/* Message Detail Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 p-6 flex items-center justify-between text-white">
                <h3 className="text-xl font-bold">
                  {selectedMessage.message_type === "payment_approval"
                    ? "Payment Approval Message"
                    : "Message Details"}
                </h3>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="hover:bg-green-800 p-2 rounded transition"
                >
                  <FiX size={24} />
                </button>
              </div>
 
              {/* Modal Content */}
              <div className="p-6 space-y-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">From Admin</p>
                  <p className="text-xs text-gray-500">
                    Received: {new Date(selectedMessage.created_at).toLocaleString()}
                  </p>
                </div>
 
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedMessage.message}
                  </p>
                </div>
 
                {selectedMessage.message_type === "payment_approval" && (
                  <div className="border-t pt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Complete Your Payment
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Once you have completed the payment as instructed above, click
                      the button below to confirm. Your profile will then be upgraded
                      to a seller account with full access to the seller dashboard.
                    </p>
                    <button
                      onClick={() => handleConfirmPayment(selectedMessage.id)}
                      disabled={confirmingPayment}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                    >
                      {confirmingPayment ? (
                        <>
                          <FiLoader size={18} className="animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        <>
                          <FiCheck size={18} />
                          Confirm Payment & Upgrade to Seller
                        </>
                      )}
                    </button>
                  </div>
                )}
 
                {/* Close Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
 
 
