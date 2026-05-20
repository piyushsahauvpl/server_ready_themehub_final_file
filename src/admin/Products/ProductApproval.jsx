import MainLayout from "../components/MainLayout";
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiEye, FiLoader, FiPackage, FiSearch, FiX } from "react-icons/fi";
import { useState, useEffect } from "react";

export default function ProductApproval() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending_review");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [action, setAction] = useState(""); // approve, reject, needs_changes
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

  useEffect(() => {
    fetchProducts();
  }, [statusFilter]);

  // poll every 30 seconds so new seller submissions show up without manual reload
  useEffect(() => {
    const interval = setInterval(() => {
      fetchProducts();
    }, 30000);
    return () => clearInterval(interval);
  }, []);


  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const url = new URL(`${API_URL}/admin/product-approval.php`);
      if (statusFilter) url.searchParams.append('status', statusFilter);
      
      const token = localStorage.getItem('auth_token');
      const res = await fetch(url, {
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      console.debug('Admin products response:', data);
      
      if (data.success && data.products) {
        setProducts(data.products);
      } else {
        setError(data.message || 'Failed to load products');
      }
    } catch (err) {
      console.error('Products fetch error', err);
      setError('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (productId, actionType, feedbackText) => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/admin/product-approval.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          product_id: productId,
          action: actionType,
          feedback: feedbackText || ''
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Product ${actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'marked for changes'} successfully!`);
        setTimeout(() => setSuccessMessage(""), 5000);
        fetchProducts();
        setSelectedProduct(null);
        setFeedback("");
        setAction("");
      } else {
        setError(data.message || 'Failed to update product');
      }
    } catch (err) {
      console.error('Approval error', err);
      setError('Error processing approval');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'approved': { color: 'bg-green-100 text-green-700', icon: FiCheckCircle, label: 'Approved' },
      'pending_review': { color: 'bg-yellow-100 text-yellow-700', icon: FiAlertCircle, label: 'Pending Review' },
      'draft': { color: 'bg-gray-100 text-gray-700', icon: FiPackage, label: 'Draft' },
      'rejected': { color: 'bg-red-100 text-red-700', icon: FiXCircle, label: 'Rejected' },
      'needs_changes': { color: 'bg-orange-100 text-orange-700', icon: FiAlertCircle, label: 'Needs Changes' }
    };
    
    const badge = badges[status] || badges['draft'];
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const filteredProducts = products.filter((p) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.seller_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg">
            <FiPackage className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Product Approval</h2>
            <p className="text-gray-500 mt-1">Review and approve seller products</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by product name or seller..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="pending_review">Pending Review</option>
            <option value="needs_changes">Needs Changes</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="draft">Draft</option>
          </select>
          <button
            onClick={fetchProducts}
            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-red-800">{error}</p>
          <button onClick={() => setError("")} className="text-red-600 hover:text-red-800">
            <FiX className="w-5 h-5" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <p className="text-green-800 font-semibold">{successMessage}</p>
          <button onClick={() => setSuccessMessage("")} className="text-green-600 hover:text-green-800">
            <FiX className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-16">
          <FiLoader className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">No products match your filter criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative">
                <img
                  src={(() => {
                    if (!product.image_url) return '/cs-assets/assets/img/placeholder.png';
                    if (product.image_url.startsWith('http')) return product.image_url;
                    return `https://uptulathemehub.com${product.image_url}`;
                  })()}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.src = '/cs-assets/assets/img/placeholder.png';
                  }}
                />
                <div className="absolute top-3 right-3">
                  {getStatusBadge(product.status)}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {product.description || 'No description'}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Seller:</span>
                    <span className="font-medium text-gray-900">{product.seller_name || product.seller_full_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-medium text-gray-900">{product.category_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Price:</span>
                    <span className="font-bold text-green-600">₹{parseFloat(product.price || 0).toFixed(2)}</span>
                  </div>
                  {product.version && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Version:</span>
                      <span className="font-medium text-gray-900">{product.version}</span>
                    </div>
                  )}
                </div>

                {product.admin_feedback && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs font-semibold text-yellow-800 mb-1">Previous Feedback:</p>
                    <p className="text-xs text-yellow-700">{product.admin_feedback}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {product.preview_url && (
                    <a
                      href={product.preview_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all font-medium text-sm"
                      title={`Preview: ${product.preview_url}`}
                    >
                      <FiEye className="w-4 h-4" />
                      View Live Preview
                    </a>
                  )}
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    style={{ backgroundColor: '#04733c' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#035a2f'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#04733c'}
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">Review and approve this product</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setFeedback("");
                    setAction("");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <img
                  src={(() => {
                    if (!selectedProduct.image_url) return '/cs-assets/assets/img/placeholder.png';
                    if (selectedProduct.image_url.startsWith('http')) return selectedProduct.image_url;
                    return `https://uptulathemehub.com${selectedProduct.image_url}`;
                  })()}
                  alt={selectedProduct.name}
                  className="w-full h-64 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = '/cs-assets/assets/img/placeholder.png';
                  }}
                />
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700">{selectedProduct.description || 'No description provided'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium">{selectedProduct.category_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Framework</p>
                  <p className="font-medium">{selectedProduct.framework_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-bold text-green-600">₹{parseFloat(selectedProduct.price || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Seller</p>
                  <p className="font-medium">{selectedProduct.seller_name || selectedProduct.seller_full_name || 'N/A'}</p>
                </div>
              </div>

              {/* Metadata Fields */}
              <div className="border-t pt-6 mt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Product Metadata</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedProduct.last_update && (
                    <div>
                      <p className="text-sm text-gray-500">Last Update</p>
                      <p className="font-medium">{selectedProduct.last_update}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">High Resolution</p>
                    <p className="font-medium">{Number(selectedProduct.high_resolution) === 1 ? '✓ Yes' : '✗ No'}</p>
                  </div>
                  {selectedProduct.compatible_browsers && (
                    <div>
                      <p className="text-sm text-gray-500">Compatible Browsers</p>
                      <p className="font-medium">{selectedProduct.compatible_browsers}</p>
                    </div>
                  )}
                  {selectedProduct.compatible_with && (
                    <div>
                      <p className="text-sm text-gray-500">Compatible With</p>
                      <p className="font-medium">{selectedProduct.compatible_with}</p>
                    </div>
                  )}
                  {selectedProduct.themeforest_files_included && (
                    <div>
                      <p className="text-sm text-gray-500">ThemeForest Files</p>
                      <p className="font-medium">{selectedProduct.themeforest_files_included}</p>
                    </div>
                  )}
                  {selectedProduct.documentation && (
                    <div>
                      <p className="text-sm text-gray-500">Documentation</p>
                      <p className="font-medium">{selectedProduct.documentation}</p>
                    </div>
                  )}
                  {selectedProduct.layout && (
                    <div>
                      <p className="text-sm text-gray-500">Layout</p>
                      <p className="font-medium">{selectedProduct.layout}</p>
                    </div>
                  )}
                  {selectedProduct.tags && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Tags</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedProduct.tags.split(',').map((tag, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedProduct.preview_url && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Live Preview</label>
                  <a
                    href={selectedProduct.preview_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg transition-all font-semibold"
                    title={`Preview: ${selectedProduct.preview_url}`}
                  >
                    <FiEye className="w-5 h-5" />
                    View Live Preview
                  </a>
                  <p className="text-xs text-gray-500 mt-2 break-all">URL: {selectedProduct.preview_url}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Admin Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="Add feedback for the seller..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleApproval(selectedProduct.id, 'approve', feedback)}
                  disabled={processing}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
                  style={{ backgroundColor: '#04733c' }}
                  onMouseEnter={(e) => !processing && (e.target.style.backgroundColor = '#035a2f')}
                  onMouseLeave={(e) => !processing && (e.target.style.backgroundColor = '#04733c')}
                >
                  <FiCheckCircle className="w-5 h-5" />
                  Approve
                </button>
                <button
                  onClick={() => handleApproval(selectedProduct.id, 'needs_changes', feedback)}
                  disabled={processing}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold disabled:opacity-50"
                >
                  <FiAlertCircle className="w-5 h-5" />
                  Request Changes
                </button>
                <button
                  onClick={() => handleApproval(selectedProduct.id, 'reject', feedback)}
                  disabled={processing}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
                >
                  <FiXCircle className="w-5 h-5" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
