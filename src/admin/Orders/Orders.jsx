import MainLayout from "../components/MainLayout";
import { FiEye, FiSearch, FiPackage, FiLoader, FiFilter, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useState, useEffect } from "react";

const statusClasses = {
  completed: "text-green-700 bg-green-100",
  pending: "text-yellow-700 bg-yellow-100",
  cancelled: "text-red-700 bg-red-100",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
  const ADMIN_API_URL = `${API_URL}/admin`;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const url = new URL(`${ADMIN_API_URL}/orders.php`);
      if (search) url.searchParams.append('search', search);
      
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      
      if (data.success && data.orders) {
        setOrders(data.orders.map(o => ({
          id: o.id,
          customer: o.customer_name || 'Unknown',
          customerEmail: o.customer_email || 'N/A',
          template: o.product_name || 'N/A',
          total: parseFloat(o.amount || 0),
          date: new Date(o.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          status: o.status || 'pending',
          payment_method: o.payment_method || 'card',
          billing_address: o.billing_address || '',
          total_purchases: parseInt(o.total_purchases || 0)
        })));
      } else {
        setError(data.message || 'Failed to load orders');
      }
    } catch (err) {
      console.error('Orders fetch error', err);
      setError('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search !== undefined) {
        fetchOrders();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const filteredOrders = orders.filter((o) =>
    (o.customer || "").toLowerCase().includes(search.toLowerCase()) ||
    (o.customerEmail || "").toLowerCase().includes(search.toLowerCase()) ||
    (o.template || "").toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredOrders.length, search]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(filteredOrders.length, startIndex + pageSize);
  const displayedOrders = filteredOrders.slice(startIndex, endIndex);

  const updateStatus = async (id, newStatus) => {
    // Optimistic update
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    
    try {
      const res = await fetch(`${ADMIN_API_URL}/orders.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, status: newStatus })
      });
      
      const data = await res.json();
      if (!data.success) {
        // Revert on error
        fetchOrders();
        setError(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Update status error', err);
      fetchOrders(); // Revert on error
      setError('Error updating status');
    }
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <FiPackage className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Order Management</h2>
            <p className="text-gray-500 mt-1">View and manage all customer orders</p>
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
              placeholder="Search by customer name or order ID..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              onChange={(e) => setSearch(e.target.value)}
              value={search}
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <FiFilter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">{filteredOrders.length} Orders</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Order Table */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
        {loading ? (
          <div className="text-center py-16">
            <FiLoader className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Template</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Purchases</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Change Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {displayedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <FiPackage className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-lg font-medium text-gray-500">No orders found</p>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-blue-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">#{o.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{o.customer}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{o.customerEmail || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 max-w-xs">
                          {o.items && o.items.length > 0 ? (
                            <div className="space-y-1">
                              {o.items.map((item, idx) => (
                                <div key={idx} className="bg-gray-50 px-2 py-1 rounded text-xs">
                                  <span className="font-medium">{item.template_title || 'Unknown'}</span>
                                  <span className="text-gray-500 ml-2">₹{item.unit_price}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span>{o.template || 'N/A'}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">₹{(o.total || 0).toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                          {o.total_purchases || 0} template{o.total_purchases !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 text-xs font-semibold rounded-full capitalize ${statusClasses[o.status] || 'bg-gray-100 text-gray-700'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{o.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white"
                          value={o.status}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button 
                          onClick={() => {
                            // Show order details in a modal or alert
                            const details = `
Order ID: #${o.id}
Customer: ${o.customer}
Email: ${o.customerEmail}
Template: ${o.template}
Amount: ₹${o.total.toFixed(2)}
Status: ${o.status}
Date: ${o.date}
Payment Method: ${o.payment_method || 'N/A'}
${o.billing_address ? `Billing Address: ${o.billing_address}` : ''}
                            `.trim();
                            alert(details);
                          }}
                          className="p-2 hover:bg-blue-100 rounded-lg transition text-blue-600" 
                          title="View Details"
                        >
                          <FiEye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredOrders.length > 0 && (
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{startIndex + 1}</span> to <span className="font-semibold">{endIndex}</span> of <span className="font-semibold">{filteredOrders.length}</span> orders
          </p>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Rows:</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-3 py-1 border border-gray-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage <= 1}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="First page"
              >
                First
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <FiChevronLeft className="w-5 h-5 text-gray-700" />
              </button>

              <div className="flex items-center gap-1">
                {(() => {
                  const pages = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    if (currentPage <= 4) {
                      pages.push(1,2,3,4,5,'...', totalPages);
                    } else if (currentPage >= totalPages - 3) {
                      pages.push(1,'...', totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages);
                    } else {
                      pages.push(1,'...', currentPage-1, currentPage, currentPage+1, '...', totalPages);
                    }
                  }

                  return pages.map((p, idx) =>
                    p === '...' ? (
                      <span key={"dots-"+idx} className="px-2 text-sm text-gray-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition ${p === currentPage ? 'bg-blue-600 text-white shadow' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                      >
                        {p}
                      </button>
                    )
                  );
                })()}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <FiChevronRight className="w-5 h-5 text-gray-700" />
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="Last page"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
