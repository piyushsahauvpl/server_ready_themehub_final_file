import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiAlertCircle, FiCheckCircle, FiShoppingBag, FiCreditCard, FiUser, FiSettings, FiTool, FiPackage } from "react-icons/fi";
import { createTicket } from "./api";

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

export default function TicketCreate() {
  const [category, setCategory] = useState("PRODUCT_ISSUE");
  const [priority, setPriority] = useState("MEDIUM");
  const [subject, setSubject] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserOrders();
  }, []);

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

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!subject.trim() || !message.trim()) {
      setError("Subject and message are required");
      return;
    }
    
    setLoading(true);
    const payload = {
      category,
      priority,
      subject: subject.trim(),
      product_id: selectedProductId ? Number(selectedProductId) : null,
      order_id: selectedOrderId ? Number(selectedOrderId) : null,
      message: message.trim(),
    };
    try {
      const res = await createTicket(payload);
      if (!res.success) {
        throw new Error(res.message || "Failed to create ticket");
      }
      setSuccess("Ticket created successfully!");
      setTimeout(() => navigate(`/support/tickets/${res.ticket_id}`), 1500);
    } catch (err) {
      setError(err.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-gray-100 py-4 sm:py-8 lg:py-10">
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-5 lg:px-4">
        {/* Header */}
        <button
          onClick={() => navigate("/support/tickets")}
          className="mb-4 flex items-center gap-2 rounded-full bg-white/85 px-3 py-2 text-sm text-gray-600 shadow-sm ring-1 ring-gray-200 transition-colors hover:text-gray-800 sm:mb-6 sm:bg-transparent sm:px-0 sm:py-0 sm:text-base sm:shadow-none sm:ring-0"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Tickets</span>
        </button>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-emerald-900/10 sm:rounded-3xl">
          {/* Header Section */}
          <div className="relative overflow-hidden px-4 py-5 text-white sm:px-6 sm:py-7 lg:px-8" style={{ background: "linear-gradient(135deg, #04733c 0%, #035a2f 100%)" }}>
            <div className="absolute inset-x-0 bottom-0 h-px bg-white/20" />
            <h1 className="mb-2 text-xl font-bold leading-tight sm:text-2xl">Create Support Ticket</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-green-100 sm:text-base">Fill in the details below and our support team will assist you</p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">
            {/* Category */}
            <div>
              <label className="mb-3 block text-sm font-bold text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2 md:grid-cols-3 sm:gap-3">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`flex min-h-[54px] items-center gap-3 rounded-xl border-2 p-3 text-left transition-all sm:min-h-[64px] sm:p-4 ${
                        category === cat.value
                          ? "border-green-600 bg-green-50 text-green-700 shadow-md"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                      style={category === cat.value ? { borderColor: "#04733c", backgroundColor: "#f0fdf4", color: "#04733c" } : {}}
                    >
                      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-gray-50 text-gray-600">
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </span>
                      <span className="text-sm font-semibold leading-snug">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="mb-3 block text-sm font-bold text-gray-700">
                Priority <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                {priorities.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`rounded-xl border-2 px-3 py-3 transition-all sm:px-4 sm:py-4 ${
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

            {/* Subject */}
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500 sm:text-base"
                placeholder="Brief description of your issue"
                required
                style={{ focusRingColor: "#04733c" }}
              />
            </div>

            {/* Purchased Products Dropdown */}
            {loadingOrders ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-green-600 mb-2" style={{ borderTopColor: "#04733c" }}></div>
                <p className="text-sm text-gray-600">Loading your orders...</p>
              </div>
            ) : (
              <>
                {purchasedProducts.length > 0 && (
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
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
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500 sm:text-base"
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
                    <label className="mb-2 block text-sm font-bold text-gray-700">
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
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500 sm:text-base"
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
              </>
            )}

            {/* Message */}
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500 sm:text-base"
                rows={5}
                placeholder="Please provide detailed information about your issue..."
                required
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
                  <FiCheckCircle className="w-5 h-5" />
                  <span className="font-semibold">{success}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t-2 border-gray-100 pt-4 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/support/tickets")}
                className="flex-1 rounded-xl border-2 border-gray-200 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-green-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
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
    </div>
  );
}
