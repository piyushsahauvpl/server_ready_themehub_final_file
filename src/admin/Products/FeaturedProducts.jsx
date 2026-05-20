import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { useNavigate } from 'react-router-dom';
import { 
  FiStar, 
  FiSearch, 
  FiLoader, 
  FiCheckCircle, 
  FiXCircle,
  FiImage,
  FiPackage,
  FiDollarSign
} from 'react-icons/fi';

const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
const FRONTEND_BASE = process.env.REACT_APP_FRONTEND_URL || 'https://uptulathemehub.com';

export default function FeaturedProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProducts();
    fetchFeaturedProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/products.php`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.products) {
        // Only show approved products
        const approved = data.products.filter(p => p.status === 'approved');
        setProducts(approved);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/featured-products.php`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.products) {
        setFeaturedProducts(data.products.map(p => p.id));
      }
    } catch (err) {
      console.error('Failed to fetch featured products:', err);
    }
  };

  const toggleFeatured = async (productId) => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const isCurrentlyFeatured = featuredProducts.includes(productId);
      const res = await fetch(`${API_URL}/admin/featured-products.php`, {
        method: isCurrentlyFeatured ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ product_id: productId })
      });

      const data = await res.json();
      
      if (data.success) {
        if (isCurrentlyFeatured) {
          setFeaturedProducts(featuredProducts.filter(id => id !== productId));
          setMessage({ type: 'success', text: 'Product removed from featured' });
        } else {
          setFeaturedProducts([...featuredProducts, productId]);
          setMessage({ type: 'success', text: 'Product added to featured' });
        }
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update featured status' });
      }
    } catch (err) {
      console.error('Failed to toggle featured:', err);
      setMessage({ type: 'error', text: 'Failed to update featured status' });
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://via.placeholder.com/300x200?text=No+Image';
    if (imageUrl.startsWith('http')) return imageUrl;
    // Normalize to frontend base (handles image paths like /backend/uploads/products/xxx.png)
    return `${FRONTEND_BASE}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <FiLoader className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg">
              <FiStar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-gray-500 mt-1">Manage products featured on the homepage</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <FiCheckCircle className="w-5 h-5" />
            ) : (
              <FiXCircle className="w-5 h-5" />
            )}
            <p>{message.text}</p>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Featured Products Count */}
        <div className="mb-4">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiStar className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-gray-800">
                  Currently Featured: {featuredProducts.length} product(s)
                </span>
              </div>
              <span className="text-sm text-gray-600">
                Maximum recommended: 6 products
              </span>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No products found</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isFeatured = featuredProducts.includes(product.id);
              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-xl shadow-md border-2 overflow-hidden transition-all duration-200 hover:shadow-lg ${
                    isFeatured 
                      ? 'border-yellow-400 bg-yellow-50' 
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={getImageUrl(product.image_url)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                      }}
                    />
                    {isFeatured && (
                      <div className="absolute top-3 right-3">
                        <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <FiStar className="w-3 h-3 fill-current" />
                          Featured
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description || 'No description'}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          ₹{parseFloat(product.price || 0).toFixed(2)}
                        </div>
                        {product.offer_price && (
                          <div className="text-sm text-gray-500 line-through">
                            ₹{parseFloat(product.offer_price).toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.category_name || 'Uncategorized'}
                      </div>
                    </div>

                    {/* Toggle Featured Button */}
                    <button
                      onClick={() => toggleFeatured(product.id)}
                      disabled={saving}
                      className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                        isFeatured
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          : 'bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {saving ? (
                        <FiLoader className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <FiStar className={`w-4 h-4 ${isFeatured ? 'fill-current' : ''}`} />
                          {isFeatured ? 'Remove from Featured' : 'Add to Featured'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </MainLayout>
  );
}
