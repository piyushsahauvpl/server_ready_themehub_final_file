import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "./CartContext";
import { useCurrency } from "../contexts/CurrencyContext";
 
export default function CartPage({ onNavigate }) {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQty, clearCart } =
    useContext(CartContext);
  const { formatPrice, convertPrice, symbol, currency } = useCurrency();
 
  // State hooks must be called at the top level, before any returns
  const [placingOrder, setPlacingOrder] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
 
  // Check if user is logged in
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) {
    return (
      <main className="cart-page container">
        <h1 className="cart-title">Shopping Cart</h1>
 
        <div className="cart-empty-card">
          <div className="cart-empty-illustration">🔒</div>
          <h3>Please Login to View Your Cart</h3>
          <p>You need to be logged in to access your shopping cart.</p>
 
          <div style={{ marginTop: 16 }}>
            <button
              className="btn btn-primary"
              style={{ marginRight: 8 }}
              onClick={() => navigate("/login")}
            >
              Login
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/register")}
            >
              Register
            </button>
          </div>
        </div>
      </main>
    );
  }
 
  // Calculate subtotal using price_inr if available (original price)
  const subtotalINR = cart.reduce(
    (sum, item) => sum + (item.price_inr || item.price || 0) * (item.qty || 1),
    0
  );
  
  // Convert to current currency
  const subtotal = convertPrice(subtotalINR);
 
  /* ================= EMPTY CART ================= */
  if (!cart || cart.length === 0) {
    return (
      <main className="cart-page container">
        <h1 className="cart-title">Shopping Cart</h1>
 
        <div className="cart-empty-card">
          <div className="cart-empty-illustration">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Browse our templates to find something you love!</p>
 
          <button
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => navigate("/")}
          >
            Browse Templates
          </button>
        </div>
      </main>
    );
  }
 
  /* ================= CART PAGE ================= */

  const handleCheckout = () => {
    // Navigate to payment page
    navigate("/payment");
  };

  return (
    <main className="cart-page container">
      <h1 className="cart-title">Shopping Cart</h1>

      {error && (
        <p style={{ color: "red", marginBottom: 12, fontSize: 14 }}>{error}</p>
      )}
      {success && (
        <p style={{ color: "green", marginBottom: 12, fontSize: 14 }}>
          {success}
        </p>
      )}

      <div className="cart-grid">
        {/* -------- CART LIST -------- */}
        <div className="cart-list">
          {cart.map((item) => (
            <div className="cart-item-row" key={item.id}>
              <img src={item.image} alt={item.title} />

              <div className="cart-item-info">
                <div className="cart-item-title">{item.title}</div>
                <div className="cart-item-author">
                  by {item.author || "Unknown"}
                </div>
              </div>

              <div className="cart-actions">
                <div className="cart-item-price">
                  {formatPrice(convertPrice(item.price_inr || item.price))}
                </div>

                {/* QTY CONTROLS */}
                <div className="qty-controls">
                  <button
                    className="qty-btn"
                    onClick={() =>
                      updateQty(item.id, Math.max(1, (item.qty || 1) - 1))
                    }
                  >
                    −
                  </button>

                  <span className="qty">{item.qty || 1}</span>

                  <button
                    className="qty-btn"
                    onClick={() =>
                      updateQty(item.id, (item.qty || 1) + 1)
                    }
                  >
                    +
                  </button>
                </div>

                <button
                  className="remove-btn"
                  onClick={() => removeFromCart(item.id)}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* -------- ORDER SUMMARY -------- */}
        <aside className="order-summary">
          <h3>Order Summary</h3>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)} {currency === 'INR' ? '' : '(approx)'}</span>
          </div>

          <div className="summary-row">
            <span>Tax (0%)</span>
            <span>{formatPrice(0)}</span>
          </div>

          <div className="summary-total">
            <span>Total ({currency})</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>

          <button
            className="btn btn-checkout"
            style={{ width: "100%", marginTop: 12 }}
            onClick={handleCheckout}
            disabled={placingOrder}
          >
            {placingOrder ? "Placing order..." : "Proceed to Checkout"}
          </button>

          <button
            className="btn"
            style={{ marginTop: 12, background: "transparent" }}
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </button>

          <button
            className="btn btn-danger"
            style={{ marginTop: 12, width: "100%" }}
            onClick={clearCart}
          >
            Clear Cart
          </button>
        </aside>
      </div>
    </main>
  );
}
 
 
