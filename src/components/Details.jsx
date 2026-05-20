import React, { useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
// Nav/Footer are rendered globally in App.jsx; avoid duplicates here
import templates from '../data/templates';
import { CartContext } from '../components/CartContext';
import { openPreviewForTemplate } from '../lib/preview';
import '../assets/css/template-details.css';
 
function TemplateDetails(){
  const { slug } = useParams();
  const [tpl, setTpl] = useState(null);
  const { addToCart } = useContext(CartContext);
 
  useEffect(() => {
    // First try local templates by slug or ID
    const found = templates.find(t =>
      String(t.slug).toLowerCase() === String(slug).toLowerCase() ||
      String(t.id) === String(slug)
    );
   
    if (found) {
      setTpl(found);
      return;
    }
 
    // Then try fetching from backend API by slug or ID
    const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
    const API = `${API_URL}/products.php?id=${slug}`;
   
    fetch(API, { credentials: 'include' })
      .then(r => r.json())
      .then(json => {
        if (json && json.success && json.data) {
          setTpl(json.data);
        } else if (!found) {
          // Fallback to first template if nothing found
          setTpl(templates[0]);
        }
      })
      .catch(err => {
        console.error('Failed to load template from API:', err);
        setTpl(templates[0]);
      });
  }, [slug]);
 
  return (
    <>
      {!tpl ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
      ) : (
      <section className="template-details-section">
        <div className="container">
          <div className="details-grid">
            <div className="preview-area">
              <div className="main-preview">
                  <div className="preview-inner">
                    {/* Decorative wave preview (matches requested design). If a heroImage is provided, show it beneath the SVG. */}
                    <svg className="wave-preview" viewBox="0 0 1200 240" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <rect width="1200" height="240" fill="#ffffff" />
                      <path d="M0,80 C150,10 350,10 520,64 C720,130 900,160 1200,80 L1200,240 L0,240 Z" fill="#071d3a" />
                    </svg>
                    {(tpl.heroImage || tpl.image || tpl.image_url) ? (
                      <img
                        id="mainPreview"
                        src={tpl.heroImage || tpl.image || tpl.image_url}
                        alt="Template Preview"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : null}
                  </div>
                <div className="price-badge-large">₹{tpl.price_display ?? (Number(tpl.price || 0).toFixed(2))}</div>
              </div>
            </div>
 
            <div className="details-sidebar">
              {tpl.downloads > 2000 && <div className="template-badge-inline">Best Seller</div>}
              <h1 className="details-title">{tpl.title || tpl.name}</h1>
              <p className="details-author">by <span>{tpl.author || tpl.seller_name || 'Admin'}</span></p>
              <div className="rating-section">
                <div className="stars">
                  {Array.from({length:5}).map((_,i)=> (
                    <i key={i} className={`fas fa-star`} />
                  ))}
                </div>
                <span id="ratingValue">{tpl.rating || 5}</span>
                <span className="sales-count">(<span id="salesCount">{tpl.downloads || 0}</span> sales)</span>
              </div>
 
              <div className="price-section">
                <div className="price">₹{tpl.price_display ?? (Number(tpl.price || 0).toFixed(2))}</div>
 
                <div className="action-row">
                  <button className="btn btn-add-cart" id="addToCartBtn" onClick={() => addToCart({ id: tpl.id, title: tpl.title || tpl.name, price: Number(tpl.price ?? tpl.regular_price ?? 0), image: tpl.image || tpl.image_url })}>
                    <i className="fas fa-shopping-cart" /> Add to Cart
                  </button>
 
                  <a className="btn btn-view-cart" href="/cart">View Cart</a>
 
                  <button className="btn btn-live-preview" onClick={() => {
                    const title = (tpl?.title || tpl?.name || '').toLowerCase();
                    const id = tpl?.id;
                   
                    // Check if we have a preview_url
                    if (tpl?.preview_url) {
                      window.open(tpl.preview_url, '_blank');
                    } else {
                      // Fallback URLs for templates without preview_url
                      const oldAgeUrl = '/templates/old-age react/index-mp-layout1.html';
                      const safariUrl = '/templates/safari new/index.html';
                      const foodUrl = '/templates/food/index.html';
                     
                      if (id === 11 || title.includes('old age')) {
                        window.open(oldAgeUrl, '_blank');
                      } else if (id === 13 || title.includes('safari')) {
                        window.open(safariUrl, '_blank');
                      } else if (id === 14 || title.includes('food')) {
                        window.open(foodUrl, '_blank');
                      } else {
                        openPreviewForTemplate(tpl);
                      }
                    }
                  }}>Live Preview</button>
 
                  <button className="btn btn-wishlist" id="wishlistBtn" aria-label="Add to wishlist"><i className="fas fa-heart" /></button>
                </div>
              </div>
 
              <div className="features-list">
                {(tpl.features || ['100+ Components','Dark Mode','Responsive','React & Vue','Documentation']).map((f, idx) => (
                  <div className="feature-item" key={idx}><span className="feature-icon">✓</span> <span>{f}</span></div>
                ))}
              </div>
 
              <div className="meta-info">
                <div className="meta-item"><span className="meta-icon">⤓</span><span><span id="downloads">{tpl.downloads || 0}</span> Downloads</span></div>
                <div className="meta-item"><span className="meta-icon">🕒</span><span>Updated <span id="lastUpdated">{tpl.updated || '15/01/2024'}</span></span></div>
              </div>
            </div>
          </div>
 
          <div className="description-section">
            <h2>Description</h2>
            <p id="templateDescription">{tpl.description || 'Premium template'}</p>
          </div>

          {/* Product Specifications Section */}
          <div className="specifications-section" style={{ marginTop: '40px', backgroundColor: '#f8f9fa', padding: '30px', borderRadius: '8px' }}>
            <h2 style={{ marginBottom: '20px' }}>Product Specifications</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              {/* Last Update */}
              {tpl.last_update && (
                <div style={{ paddingBottom: '15px', borderBottom: '1px solid #e0e0e0' }}>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>Last Update</span>
                  <p style={{ margin: '5px 0 0 0', color: '#666' }}>{new Date(tpl.last_update).toLocaleDateString()}</p>
                </div>
              )}

              {/* High Resolution */}
              {tpl.high_resolution && (
                <div style={{ paddingBottom: '15px', borderBottom: '1px solid #e0e0e0' }}>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>High Resolution</span>
                  <p style={{ margin: '5px 0 0 0', color: '#666' }}>✓ Includes high resolution assets</p>
                </div>
              )}

              {/* Compatible Browsers */}
              {tpl.compatible_browsers && (
                <div style={{ paddingBottom: '15px', borderBottom: '1px solid #e0e0e0' }}>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>Compatible Browsers</span>
                  <p style={{ margin: '5px 0 0 0', color: '#666' }}>{tpl.compatible_browsers}</p>
                </div>
              )}

              {/* Compatible With */}
              {tpl.compatible_with && (
                <div style={{ paddingBottom: '15px', borderBottom: '1px solid #e0e0e0' }}>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>Compatible With</span>
                  <p style={{ margin: '5px 0 0 0', color: '#666' }}>{tpl.compatible_with}</p>
                </div>
              )}

              {/* Themehub Files Included */}
              {(tpl.themehub_files_included || tpl.themeforest_files_included) && (
                <div style={{ paddingBottom: '15px', borderBottom: '1px solid #e0e0e0' }}>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>Themehub Files Included</span>
                  <p style={{ margin: '5px 0 0 0', color: '#666' }}>{tpl.themehub_files_included || tpl.themeforest_files_included}</p>
                </div>
              )}

              {/* Documentation */}
              {tpl.documentation && (
                <div style={{ paddingBottom: '15px', borderBottom: '1px solid #e0e0e0' }}>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>Documentation</span>
                  <p style={{ margin: '5px 0 0 0', color: '#666' }}>{tpl.documentation}</p>
                </div>
              )}

              {/* Layout */}
              {tpl.layout && (
                <div style={{ paddingBottom: '15px', borderBottom: '1px solid #e0e0e0' }}>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>Layout</span>
                  <p style={{ margin: '5px 0 0 0', color: '#666' }}>{tpl.layout}</p>
                </div>
              )}

              {/* Tags */}
              {tpl.tags && (
                <div style={{ paddingBottom: '15px', borderBottom: '1px solid #e0e0e0', gridColumn: '1 / -1' }}>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>Tags</span>
                  <div style={{ margin: '10px 0 0 0', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {tpl.tags.split(',').map((tag, idx) => (
                      <span key={idx} style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85em' }}>
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      )}
    </>
  );
}
 
export default TemplateDetails;
 
 