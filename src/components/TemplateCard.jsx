import React, { useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getTemplateUrl } from '../lib/slug';
import productStore from '../lib/productStore';
import { useCurrency } from '../contexts/CurrencyContext';

export default function TemplateCard({
  item,
  onAdd,
  showAuthor = true,
  showQuickView = false
}) {
  const navigate = useNavigate();
  const [showQuick, setShowQuick] = React.useState(false);
  const { formatPrice, convertPrice } = useCurrency();

  const openProduct = () => {
    productStore.set(item);
    navigate(getTemplateUrl(item));
  };

  const openQuickView = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    productStore.set(item);
    setShowQuick(true);
  };

  const closeQuickView = () => setShowQuick(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeQuickView();
    };
    if (showQuick) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showQuick]);

  // Get the price to display (converted if multi-currency, original if INR only)
  const priceINR = item.price_inr || item.price;
  const displayPrice = formatPrice(convertPrice(priceINR));

  return (
    <article className="tf-card tf-card-equal">
      {/* IMAGE */}
      <div className="tf-image">
        <Link
          to={getTemplateUrl(item)}
          onClick={(e) => {
            if (showQuickView) openQuickView(e);
            else productStore.set(item);
          }}
        >
          <img src={item.image} alt={item.title} />
        </Link>

        {item.badge && <span className="tf-badge">{item.badge}</span>}
      </div>

      {/* CONTENT */}
      <div className="tf-content">
        <h3 className="tf-title">{item.title}</h3>

        {/* RATING */}
        <div className="tf-rating">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`star ${i < Math.round(item.rating) ? 'filled' : ''}`}
            >
              ★
            </span>
          ))}
        </div>

        {/* FOOTER */}
        <div className="tf-footer">
          <div className="tf-price">{displayPrice}</div>

          <button className="tf-demo-btn" onClick={openProduct}>
            Live Demo
          </button>
        </div>
      </div>

      {/* QUICK VIEW (UNCHANGED LOGIC) */}
      {showQuick && (
        <div className="pp-modal" onClick={closeQuickView}>
          <div
            className="pp-modal-box quickview"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={item.image} alt={item.title} />
            <div className="quickview-body">
              <h3>{item.title}</h3>
              <p>
                {(item.description || item.desc || '').replace(/<[^>]+>/g, '')}
              </p>
              <div className="quickview-actions">
                <strong>{displayPrice}</strong>
                <button
                  className="btn btn-add"
                  onClick={() => {
                    onAdd && onAdd(item);
                    closeQuickView();
                  }}
                >
                  Add to Cart
                </button>
                <button className="btn" onClick={openProduct}>
                  Open Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
