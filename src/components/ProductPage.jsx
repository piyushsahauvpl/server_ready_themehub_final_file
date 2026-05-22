import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiHeart } from "react-icons/fi";
import { useCurrency } from "../contexts/CurrencyContext";
import { createCartItem, formatDisplayPrice } from "../lib/currency";
import productStore from "../lib/productStore";
import cartManager from "../lib/cartManager";
import { openPreviewForTemplate } from "../lib/preview";
import { getTemplateUrl } from "../lib/slug";

export default function ProductPage() {

  const navigate = useNavigate();

  const { id } = useParams();

  const [product, setProduct] = useState(productStore.get());

  const [showPreview, setShowPreview] = useState(false);

  const [inWishlist, setInWishlist] = useState(false);

  const [loading, setLoading] = useState(false);

  const currencyContext = useCurrency();
  const activeCurrency = currencyContext.currency || 'INR';

  /**
   * Subscribe to product store updates
   */

  useEffect(() => {

    const unsub = productStore.subscribe((p) => {

      if (p) {
        setProduct(p);
      }

    });

    return unsub;

  }, []);

  /**
   * Load product from backend if store empty
   */

  useEffect(() => {

    if (!product && id) {

      const loadProduct = async () => {

        try {

          setLoading(true);

          const API_URL =
            process.env.REACT_APP_API_URL ||
            "https://uptulathemehub.com/backend/api";

          const API = `${API_URL}/products.php?id=${encodeURIComponent(id)}&currency=${encodeURIComponent(activeCurrency)}`;

          const response = await fetch(API, {
            credentials: 'include'
          });

          const json = await response.json();

          console.log("PRODUCT API RESPONSE:", json);

          if (json && json.success && json.data) {

            setProduct(json.data);

            productStore.set(json.data);

          } else {

            setProduct(null);
          }

        } catch (err) {

          console.error(
            "Failed to load product:",
            err
          );

        } finally {

          setLoading(false);
        }
      };

      loadProduct();
    }

  }, [id, product, activeCurrency]);

  /**
   * Redirect old product URLs to canonical template URL
   */

  useEffect(() => {

    if (product) {

      const slugTarget = getTemplateUrl(product);

      if (
        slugTarget &&
        !window.location.pathname.startsWith('/template/')
      ) {

        productStore.set(product);

        navigate(slugTarget, { replace: true });
      }
    }

  }, [product, navigate]);

  /**
   * Loading state
   */

  if (loading) {

    return (

      <div style={{ padding: 40 }}>

        <h2>Loading...</h2>

      </div>
    );
  }

  /**
   * Product not found
   */

  if (!product) {

    return (

      <div style={{ padding: 40 }}>

        <h2>Product not found</h2>

        <button onClick={() => navigate("/")}>
          Back
        </button>

      </div>
    );
  }

  /**
   * SAFE PRICE HANDLING
   */

  const displayPrice = formatDisplayPrice(product, currencyContext);

  /**
   * Add to cart
   */

  const addToCart = () => {

    try {

      const raw = localStorage.getItem('user');

      if (!raw) {

        try {

          window.dispatchEvent(
            new CustomEvent('authRequired', {
              detail: {
                message: 'Please register and login'
              }
            })
          );

        } catch (e) {}

        alert('Please register and login');

        return;
      }

    } catch (e) {}

    cartManager.addItem(createCartItem(product));
  };

  return (

    <main className="pp-page">

      <div className="pp-container">

        <div className="pp-layout">

          {/* LEFT IMAGE */}

          <section className="pp-media">

            <img
              src={
                product.image ||
                product.image_url ||
                '/cs-assets/assets/img/placeholder.png'
              }
              alt={product.title}
              className="pp-image"
              style={{ cursor: 'pointer' }}
              onClick={() => setShowPreview(true)}
              onError={(e) => {
                e.target.src =
                  '/cs-assets/assets/img/placeholder.png';
              }}
            />

            <div className="pp-summary">

              <h2>{product.title || product.name}</h2>

              <p className="pp-author">
                by {
                  product.author ||
                  product.seller_name ||
                  "ThemeStudio"
                }
              </p>

              <p className="pp-desc">
                {product.description || product.desc}
              </p>

            </div>

          </section>

          {/* RIGHT CARD */}

          <aside className="pp-card">

            <span className="pp-badge">
              {product.badge || "Best Seller"}
            </span>

            {/* PRICE BADGE */}

            <div className="pp-price-badge">

              {displayPrice}

            </div>

            <h1 className="pp-title">

              {product.title || product.name}

            </h1>

            <p className="pp-by">

              by <span>
                {
                  product.author ||
                  product.seller_name ||
                  "ThemeStudio"
                }
              </span>

            </p>

            <div className="pp-rating">

              <span className="pp-stars">
                ★★★★★
              </span>

              <span className="pp-score">
                4.9
              </span>

              <span className="pp-sales">
                (2847 sales)
              </span>

            </div>

            <div className="pp-price-row">

              {/* MAIN PRICE */}

              <div className="pp-price">

                {displayPrice}

              </div>

              {/* BUTTONS */}

              <div className="pp-btn-group">

                <button
                  className="pp-btn-primary"
                  onClick={addToCart}
                >
                  Add to Cart
                </button>

                <button
                  onClick={() => navigate('/cart')}
                  className="pp-btn-secondary"
                >
                  View Cart
                </button>

                <button
                  className="pp-btn-outline pp-live"
                  onClick={() => {

                    if (product?.preview_url) {

                      window.open(
                        product.preview_url,
                        '_blank'
                      );

                    } else {

                      openPreviewForTemplate(product);
                    }
                  }}
                >
                  Live Preview
                </button>

                <button
                  className="pp-btn-wishlist"
                  onClick={() => setInWishlist(!inWishlist)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '20px'
                  }}
                  title={
                    inWishlist
                      ? 'Remove from Wishlist'
                      : 'Add to Wishlist'
                  }
                >

                  <FiHeart
                    style={{
                      fill: inWishlist
                        ? '#dc2626'
                        : 'none',

                      color: inWishlist
                        ? '#dc2626'
                        : '#666'
                    }}
                  />

                </button>

              </div>

            </div>

            {/* FEATURES */}

            <ul className="pp-features">

              <li>✔ 100+ Components</li>
              <li>✔ Dark Mode</li>
              <li>✔ Responsive</li>
              <li>✔ React & Vue</li>
              <li>✔ Documentation</li>

            </ul>

            {/* META */}

            <div className="pp-meta">

              <div className="meta-item">
                <i className="fas fa-download" />
                <span>
                  {product.downloads || 5632} Downloads
                </span>
              </div>

              <div className="meta-item">
                <i className="fas fa-clock" />
                <span>
                  Updated {product.updated || '15/01/2024'}
                </span>
              </div>

            </div>

          </aside>

        </div>

        {/* DESCRIPTION */}

        <section className="pp-description">

          <h3>Description</h3>

          <div
            dangerouslySetInnerHTML={{
              __html:
                product.description ||
                product.longDesc ||
                product.desc ||
                "A comprehensive admin dashboard with modern components."
            }}
          />

        </section>

      </div>

      {/* IMAGE MODAL */}

      {showPreview && (

        <div
          className="pp-modal"
          onClick={() => setShowPreview(false)}
        >

          <div
            className="pp-modal-box"
            onClick={e => e.stopPropagation()}
          >

            <img
              src={
                product.image ||
                product.image_url ||
                '/cs-assets/assets/img/placeholder.png'
              }
              alt={product.title || "Preview"}
              onError={(e) => {
                e.target.src =
                  '/cs-assets/assets/img/placeholder.png';
              }}
            />

          </div>

        </div>
      )}

    </main>
  );
}
