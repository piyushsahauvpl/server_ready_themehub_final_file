import React, { useState, useEffect } from "react";
import { FiX, FiAlertCircle, FiShoppingBag, FiCreditCard, FiUser, FiSettings, FiTool, FiPackage } from "react-icons/fi";

const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

const categories = [
  { value: "PRODUCT_ISSUE", label: "Product Issue", icon: FiShoppingBag },
  { value: "ORDER_ISSUE", label: "Order Issue", icon: FiShoppingBag },
  { value: "PAYMENT_ISSUE", label: "Payment Issue", icon: FiCreditCard },
  { value: "ACCOUNT_ISSUE", label: "Account Issue", icon: FiUser },
  { value: "TECHNICAL_ISSUE", label: "Technical Issue", icon: FiTool },
  { value: "GENERAL_INQUIRY", label: "General Inquiry", icon: FiSettings },
];

const priorities = [
  { value: "LOW", label: "Low", color: "bg-gray-500" },
  { value: "MEDIUM", label: "Medium", color: "bg-yellow-500" },
  { value: "HIGH", label: "High", color: "bg-orange-500" },
  { value: "URGENT", label: "Urgent", color: "bg-red-500" },
];

export default function TicketModal({ isOpen, onClose, productId = null, orderId = null, productName = null }) {
  const [category, setCategory] = useState("PRODUCT_ISSUE");
  const [priority, setPriority] = useState("MEDIUM");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(orderId || "");
  const [selectedProductId, setSelectedProductId] = useState(productId || "");
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUserOrders();
      // Set defaults if provided
      if (productId) setSelectedProductId(productId);
      if (orderId) setSelectedOrderId(orderId);
    }
  }, [isOpen, productId, orderId]);

  const fetchUserOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`${API_URL}/orders.php`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Get unique products from orders
  const purchasedProducts = orders
    .filter((order) => order.product_id && order.product_name)
    .reduce((acc, order) => {
      if (!acc.find((p) => p.product_id === order.product_id)) {
        acc.push({
          product_id: order.product_id,
          product_name: order.product_name,
          product_image: order.product_image,
          order_id: order.id,
        });
      }
      return acc;
    }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!subject.trim() || !message.trim()) {
      setError("Subject and message are required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        category,
        priority,
        subject: subject.trim(),
        message: message.trim(),
        product_id: selectedProductId ? Number(selectedProductId) : null,
        order_id: selectedOrderId ? Number(selectedOrderId) : null,
      };

      const res = await fetch(`${API_URL}/tickets.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to create ticket");
      }

      setSuccess("Ticket created successfully! Ticket #: " + data.ticket_number);
      setTimeout(() => {
        onClose();
        window.location.href = `/support/tickets/${data.ticket_id}`;
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-gradient-to-r from-green-600 to-green-700" style={{ background: "linear-gradient(135deg, #04733c 0%, #035a2f 100%)" }}>
          <h2 className="text-2xl font-bold text-white">Raise a Support Ticket</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Pre-filled Product Info */}
          {productName && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <FiAlertCircle className="w-5 h-5" />
                <span className="font-semibold">Related Product</span>
              </div>
              <p className="text-sm text-green-700 mt-2">
                <strong>Product:</strong> {productName}
              </p>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex items-center gap-2 p-3 border-2 rounded-lg transition-all ${
                      category === cat.value
                        ? "border-green-600 bg-green-50 text-green-700 shadow-md"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                    style={category === cat.value ? { borderColor: "#04733c", backgroundColor: "#f0fdf4", color: "#04733c" } : {}}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Priority <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`flex-1 p-3 border-2 rounded-lg transition-all ${
                    priority === p.value
                      ? "border-green-600 bg-green-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                  style={priority === p.value ? { borderColor: "#04733c", backgroundColor: "#f0fdf4" } : {}}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${p.color}`}></span>
                    <span className="text-sm font-semibold">{p.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Purchased Products Dropdown */}
          {purchasedProducts.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Related Product (Optional)
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  // Find the order for this product
                  const order = orders.find((o) => o.product_id === Number(e.target.value));
                  if (order) setSelectedOrderId(order.id);
                }}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                style={{ focusRingColor: "#04733c" }}
              >
                <option value="">Select a purchased product...</option>
                {purchasedProducts.map((product) => (
                  <option key={product.product_id} value={product.product_id}>
                    {product.product_name} (Order #{product.order_id})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select a product you've purchased to link it to this ticket
              </p>
            </div>
          )}

          {/* Orders Dropdown */}
          {orders.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Related Order (Optional)
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => {
                  setSelectedOrderId(e.target.value);
                  // Find the product for this order
                  const order = orders.find((o) => o.id === Number(e.target.value));
                  if (order && order.product_id) setSelectedProductId(order.product_id);
                }}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                style={{ focusRingColor: "#04733c" }}
              >
                <option value="">Select an order...</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    Order #{order.id} - {order.product_name || "Product"} - ₹{parseFloat(order.amount || 0).toFixed(2)} ({new Date(order.created_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select an order to link it to this ticket
              </p>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
              placeholder="Brief description of your issue"
              required
              style={{ focusRingColor: "#04733c" }}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
              rows={6}
              placeholder="Please provide detailed information about your issue..."
              required
              style={{ focusRingColor: "#04733c" }}
            />
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <FiAlertCircle className="w-5 h-5" />
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <FiAlertCircle className="w-5 h-5" />
                <span className="font-semibold">{success}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#04733c" }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = "#035a2f";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = "#04733c";
              }}
            >
              {loading ? "Creating Ticket..." : "Create Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
