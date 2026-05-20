import React, { useEffect, useState, useRef } from 'react';
import { formatPrice } from '../lib/currency';
import firstImg from '../assets/images/first.png';
import secondImg from '../assets/images/second.png';
import bannerImg from '../assets/images/banner-img.png';

export default function Features() {
  const templates = [
    { id: 1, title: 'Dashboard Pro', author: 'ThemeHub', price: 49, image: firstImg },
    { id: 2, title: 'Landing Page', author: 'CreativeStudio', price: 29, image: secondImg },
    { id: 3, title: 'E-Commerce', author: 'ShopPlay', price: 59, image: bannerImg }
  ];

  // Cart state and persistence (acts like cartManager)
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem('themehub_cart');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  const saveCart = (next) => {
    setCart(next);
    try { localStorage.setItem('themehub_cart', JSON.stringify(next)); } catch (e) {}
  };

  const getCart = () => cart;
  const removeItem = (id) => {
    saveCart(cart.filter(i => i.id !== id));
  };

  const getTotal = () => cart.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0);

  const showNotification = (msg, type = 'info') => {
    setNotification({ msg, type });
    window.setTimeout(() => setNotification(null), 3000);
  };

  const addToCart = (item) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      const next = cart.map(i => i.id === item.id ? { ...i, qty: (i.qty || 1) + 1 } : i);
      saveCart(next);
    } else {
      saveCart([...cart, { ...item, qty: 1 }]);
    }
    showNotification(`${item.title} added to cart`, 'success');
  };

  // Slider state
  const [index, setIndex] = useState(0);
  const sliderRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % templates.length), 5000);
    return () => clearInterval(id);
  }, []);

  // notification
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // keep localStorage in sync if cart changed externally
    const onStorage = (e) => {
      if (e.key === 'themehub_cart') {
        try {
          setCart(e.newValue ? JSON.parse(e.newValue) : []);
        } catch (_) {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <section className="features-panel" style={{padding:20}}>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:20,alignItems:'start'}}>
        <div>
          <h3>Templates Slider</h3>
          <div ref={sliderRef} style={{position:'relative',overflow:'hidden',borderRadius:8}}>
            <div style={{display:'flex',transform:`translateX(-${index * 100}%)`,transition:'transform 400ms ease'}}>
              {templates.map(t => (
                <div key={t.id} style={{minWidth:'100%',boxSizing:'border-box',padding:12,display:'flex',gap:12,alignItems:'center'}}>
                  <img src={t.image} alt={t.title} style={{width:220,height:140,objectFit:'cover',borderRadius:8,flex:'0 0 auto'}} />
                  <div>
                    <h4 style={{margin:0}}>{t.title}</h4>
                    <p style={{margin:'6px 0',color:'#6b7280'}}>by {t.author}</p>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <strong>{formatPrice(t.price)}</strong>
                      <button className="btn" onClick={() => addToCart(t)} style={{padding:'8px 12px'}}>Add to cart</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button aria-label="Previous" onClick={() => setIndex(i => (i - 1 + templates.length) % templates.length)} style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)'}}>‹</button>
            <button aria-label="Next" onClick={() => setIndex(i => (i + 1) % templates.length)} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)'}}>›</button>
          </div>
        </div>

        <aside>
          <h3>Your Cart</h3>
          <div id="emptyCart" style={{display: cart.length === 0 ? 'block' : 'none',padding:12,border:'1px dashed #e5e7eb',borderRadius:8}}>
            <p>Your cart is empty.</p>
          </div>

          <div id="cartContent" style={{display: cart.length === 0 ? 'none' : 'grid',gap:8}}>
            <div id="cartItems">
              {cart.map(item => (
                <div key={item.id} className="cart-item" style={{display:'flex',gap:8,alignItems:'center',padding:8,borderBottom:'1px solid rgba(0,0,0,0.04)'}}>
                  <div style={{width:64,height:48,flex:'0 0 auto'}}>
                    <img src={item.image} alt={item.title} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:6}} />
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600}}>{item.title}</div>
                    <div style={{fontSize:12,color:'#6b7280'}}>by {item.author}</div>
                  </div>
                  <div style={{minWidth:60,textAlign:'right'}}>{formatPrice(item.price)}</div>
                  <button className="remove-btn" onClick={() => removeItem(item.id)} style={{marginLeft:8}} title="Remove">🗑</button>
                </div>
              ))}
            </div>

            <div style={{Padding:8,display:'flex',flexDirection:'column',gap:8,border:'1px solid rgba(0,0,0,0.04)',borderRadius:6}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span>Subtotal</span>
                <strong id="subtotal">{formatPrice(getTotal())}</strong>
              </div>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span>Total</span>
                <strong id="total">{formatPrice(getTotal())}</strong>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button id="checkoutBtn" className="btn" onClick={() => showNotification('Checkout functionality - Demo only', 'info')} style={{flex:1}}>Checkout</button>
                <button className="btn" onClick={() => { saveCart([]); showNotification('Cart cleared', 'info'); }} style={{flex:1}}>Clear</button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {notification && (
        <div style={{position:'fixed',right:20,bottom:20,background:'#111827',color:'#fff',padding:'10px 14px',borderRadius:8}}>
          {notification.msg}
        </div>
      )}
    </section>
  );
}
