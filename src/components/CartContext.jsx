import { useEffect, useState, createContext } from "react";
import cartManager from "../lib/cartManager";
 
// Create context
export const CartContext = createContext(null);
 
// Provider component
export function CartProvider({ children }) {
  const [cart, setCart] = useState(cartManager.getCart());
 
  useEffect(() => {
    const unsubscribe = cartManager.subscribe((nextCart) => {
      setCart(nextCart);
    });
 
    return unsubscribe;
  }, []);
 
  // Listen for auth changes to refresh/clear cart when user logs in/out
  useEffect(() => {
    function onAuthChange(e) {
      const user = e?.detail?.user ?? null;
      if (!user) {
        // ensure cart is cleared on logout
        try { cartManager.clear(); } catch (err) {}
        setCart([]);
      } else {
        // on login, re-read cart from storage (in case it was restored server-side)
        try { setCart(cartManager.getCart()); } catch (err) {}
      }
    }
 
    window.addEventListener('authChange', onAuthChange);
    return () => window.removeEventListener('authChange', onAuthChange);
  }, []);
 
  // Cart actions
  const addToCart = (item) => {
    // require user to be logged in before adding to cart
    try {
      const raw = localStorage.getItem('user');
      if (!raw) {
        // fallback UX: alert the user and do not add
        try { window.dispatchEvent(new CustomEvent('authRequired', { detail: { message: 'Please register and login' } })); } catch (e){}
        alert('Please register and login');
        return;
      }
    } catch (e) { /* ignore */ }
 
    cartManager.addItem(item);
  };
  const removeFromCart = (id) => cartManager.removeItem(id);
  const clearCart = () => cartManager.clear();
  const updateQty = (id, qty) =>
    cartManager.updateQty(id, Math.max(1, qty)); // safety guard
 
  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        updateQty,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
 
 