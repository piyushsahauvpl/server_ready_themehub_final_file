import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiTrash2, FiEye, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { CartContext } from '../components/CartContext';
import Footer from '../components/Footer';
import { getTemplateUrl } from '../lib/slug';
import '../assets/css/style.css';

export default function Wishlist() {
  const navigate = useNavigate();
  const { addToCart } = React.useContext(CartContext);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    try {
      const authRes = await fetch(`${API_URL}/check-auth.php`, { credentials: 'include' });
      const authData = await authRes.json();
      
      if (authData.authenticated) {
        fetchWishlist();
      } else {
        navigate('/login');
      }
    } catch (err) {
      console.error('Auth check error:', err);
      navigate('/login');
    }
  };

  const fetchWishlist = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/wishlist.php`, { credentials: 'include' });
      const data = await res.json();
      
      if (data.success && data.items) {
        setWishlistItems(data.items);
        window.dispatchEvent(new CustomEvent('wishlistChange', { detail: { count: data.items.length } }));
      } else {
        setError(data.message || 'Failed to load wishlist');
      }
    } catch (err) {
      console.error('Wishlist fetch error:', err);
      setError('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    setRemoving(productId);
    try {
      const res = await fetch(`${API_URL}/wishlist.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ product_id: productId })
      });
      const data = await res.json();
      
      if (data.success) {
        setWishlistItems(items => {
          const nextItems = items.filter(item => item.product_id !== productId);
          window.dispatchEvent(new CustomEvent('wishlistChange', { detail: { count: nextItems.length } }));
          return nextItems;
        });
      } else {
        alert(data.message || 'Failed to remove from wishlist');
      }
    } catch (err) {
      console.error('Remove wishlist error:', err);
      alert('Failed to remove from wishlist');
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <>
        <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <FiLoader className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: '#04733c' }} />
          <p style={{ color: '#6b7280' }}>Loading your wishlist...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <h1>My Wishlist</h1>
          <p className="lead">Your saved favorite products</p>
        </div>
      </section>

      <section style={{ padding: '40px 0', background: '#f9fafb', minHeight: '60vh' }}>
        <div className="container">
          {error && (
            <div style={{ 
              padding: '16px', 
              background: '#fee2e2', 
              border: '1px solid #dc2626', 
              borderRadius: '8px', 
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#dc2626'
            }}>
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}

          {wishlistItems.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '80px 20px',
              background: '#fff',
              borderRadius: '14px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              <FiHeart style={{ fontSize: '64px', color: '#d1d5db', marginBottom: '20px' }} />
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '12px', color: '#1a1a1a' }}>
                Your wishlist is empty
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                Start adding products you love to your wishlist!
              </p>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#04733c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#035a2f';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#04733c';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Browse Products
              </button>
            </div>
          ) : (
            <>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '24px',
                background: '#fff',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a1a' }}>
                  {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} in your wishlist
                </h2>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px'
              }}>
                {wishlistItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: '#fff',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: '2px solid #e5e7eb',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(4,115,60,0.15)';
                      e.currentTarget.style.borderColor = '#04733c';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                    onClick={() => navigate(getTemplateUrl({ id: item.product_id, name: item.product_name || item.name }))}
                  >
                    <div style={{ 
                      width: '100%', 
                      height: '200px', 
                      overflow: 'hidden',
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #e5e7eb 100%)',
                      position: 'relative'
                    }}>
                      <img
                        src={item.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
                        alt={item.product_name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                        }}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromWishlist(item.product_id);
                        }}
                        disabled={removing === item.product_id}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          padding: '8px',
                          background: '#fff',
                          border: '2px solid #dc2626',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          zIndex: 10
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#fee2e2';
                          e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#fff';
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        {removing === item.product_id ? (
                          <FiLoader className="animate-spin" style={{ color: '#dc2626' }} />
                        ) : (
                          <FiTrash2 style={{ color: '#dc2626', fontSize: '16px' }} />
                        )}
                      </button>
                    </div>
                    <div style={{ padding: '18px' }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        marginBottom: '8px',
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {item.product_name}
                      </h3>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px',
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        {item.category_name && (
                          <span style={{
                            padding: '4px 8px',
                            background: '#f0fdf4',
                            color: '#04733c',
                            borderRadius: '4px',
                            fontWeight: '500'
                          }}>
                            {item.category_name}
                          </span>
                        )}
                        {item.framework_name && (
                          <span style={{
                            padding: '4px 8px',
                            background: '#f3f4f6',
                            color: '#4b5563',
                            borderRadius: '4px',
                            fontWeight: '500'
                          }}>
                            {item.framework_name}
                          </span>
                        )}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}>
                        <div style={{
                          fontSize: '20px',
                          fontWeight: '700',
                          color: '#04733c'
                        }}>
                          ₹{Number(item.price || 0).toFixed(2)}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {item.preview_url && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(item.preview_url, '_blank', 'noopener,noreferrer');
                              }}
                              style={{
                                padding: '8px',
                                background: 'transparent',
                                border: '1px solid #04733c',
                                borderRadius: '6px',
                                color: '#04733c',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#04733c';
                                e.target.style.color = '#fff';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'transparent';
                                e.target.style.color = '#04733c';
                              }}
                            >
                              <FiEye />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart({
                                id: item.product_id,
                                title: item.product_name,
                                price: Number(item.price || 0),
                                image: item.image_url
                              });
                            }}
                            style={{
                              padding: '8px 16px',
                              background: '#04733c',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#fff',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '14px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#035a2f';
                              e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = '#04733c';
                              e.target.style.transform = 'translateY(0)';
                            }}
                          >
                            <FiShoppingCart /> Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
