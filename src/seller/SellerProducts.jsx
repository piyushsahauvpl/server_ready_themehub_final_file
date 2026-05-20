import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiPackage, 
  FiPlus, 
  FiEdit, 
  FiEye, 
  FiLoader, 
  FiSearch,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiAlertCircle,
  FiArrowLeft,
  FiTrash2
} from 'react-icons/fi';

export default function SellerProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Feedback popup state
  const [feedbackPopup, setFeedbackPopup] = useState({ open: false, message: '' });

  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

  useEffect(() => {
    fetchProducts();
  }, [statusFilter]);
  // Removed seller/check-auth.php check, now relies only on user session

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch seller's products
      const res = await fetch(`${API_URL}/seller/products.php`, {
        credentials: 'include'
      });
      const data = await res.json();
      console.debug('Seller products response:', data);
      
      if (data.success && data.products) {
        setProducts(data.products);
      } else {
        setError(data.message || 'Failed to load products');
      }
    } catch (err) {
      console.error('Products fetch error:', err);
      setError('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/seller/products.php?id=${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      
      if (data.success) {
        setProducts(products.filter(p => p.id !== productId));
        setError('');
      } else {
        setError(data.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Error deleting product');
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search !== undefined) {
        // Filter products locally
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const getStatusBadge = (status) => {
    const badges = {
      'approved': { color: 'bg-green-100 text-green-700', icon: FiCheckCircle, label: 'Approved' },
      'pending_review': { color: 'bg-yellow-100 text-yellow-700', icon: FiClock, label: 'Pending Review' },
      'draft': { color: 'bg-gray-100 text-gray-700', icon: FiAlertCircle, label: 'Draft' },
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

  const filteredProducts = products.filter((p) => {
    const matchesSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
                         (p.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium"
                style={{ 
                  backgroundColor: '#f0fdf4',
                  color: '#04733c',
                  border: '1px solid #04733c'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#04733c';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateX(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0fdf4';
                  e.currentTarget.style.color = '#04733c';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <FiArrowLeft className="w-4 h-4" />
                Go Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
            </div>
            <button
              onClick={() => navigate('/seller/products/add')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              style={{ backgroundColor: '#04733c' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#035a2f'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#04733c'}
            >
              <FiPlus className="w-5 h-5" />
              Add Product
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
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
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending_review">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="needs_changes">Needs Changes</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-16">
            <FiLoader className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-6">
              {search || statusFilter ? 'Try adjusting your filters' : 'Get started by adding your first product'}
            </p>
            {!search && !statusFilter && (
              <button
                onClick={() => navigate('/seller/products/add')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                style={{ backgroundColor: '#04733c' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#035a2f'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#04733c'}
              >
                <FiPlus className="w-5 h-5 inline mr-2" />
                Add Your First Product
              </button>
            )}
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
                      let cleanPath = product.image_url.startsWith('/') ? product.image_url : `/${product.image_url}`;
                      if (!cleanPath.startsWith('/backend/')) {
                        cleanPath = `/backend${cleanPath}`;
                      }
                      return `https://uptulathemehub.com${cleanPath}`;
                    })()}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src = '/cs-assets/assets/img/placeholder.png';
                    }}
                  />
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(product.status)}
                    {/* Feedback button for not approved products */}
                    {product.admin_feedback && product.status !== 'approved' && (
                      <button
                        className="ml-2 mt-2 px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-200 transition"
                        onClick={() => setFeedbackPopup({ open: true, message: product.admin_feedback })}
                      >
                        See Feedback
                      </button>
                    )}
                    {/* Dummy feedback button for not approved products without feedback */}
                    {!product.admin_feedback && product.status !== 'approved' && (
                      <button
                        className="ml-2 mt-2 px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition"
                        onClick={() => setFeedbackPopup({ open: true, message: 'Feedback still not updated yet' })}
                      >
                        See Feedback
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description || 'No description'}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Price</p>
                      <p className="text-lg font-bold text-gray-900">
                        ₹{parseFloat(product.price || 0).toFixed(2)}
                      </p>
                    </div>
                    {product.offer_price && (
                      <div>
                        <p className="text-xs text-gray-500">Offer</p>
                        <p className="text-lg font-bold text-green-600">
                          ₹{parseFloat(product.offer_price).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Feedback is now shown in popup, not inline */}

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/seller/products/${product.id}/edit`)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                    >
                      <FiEdit className="w-4 h-4" />
                      Edit
                    </button>
                    {product.preview_url && (
                      <a
                        href={product.preview_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all font-medium text-sm"
                        title={`Preview: ${product.preview_url}`}
                      >
                        <FiEye className="w-4 h-4" />
                        View Preview
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="flex items-center justify-center gap-2 px-3 py-2 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium text-red-600"
                      title="Delete product"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    {/* Feedback Popup Modal */}
    {feedbackPopup.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full relative">
          <button
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
            onClick={() => setFeedbackPopup({ open: false, message: '' })}
            aria-label="Close"
          >
            &times;
          </button>
          <h2 className="text-lg font-semibold mb-2 text-yellow-800">Admin Feedback</h2>
          <p className="text-gray-700 text-sm whitespace-pre-line">{feedbackPopup.message}</p>
        </div>
      </div>
    )}
  </div>
  );
}
