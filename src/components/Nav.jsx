import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import cartManager from '../lib/cartManager';
import logoImg from '../assets/images/themehublogo.png';
import useSellerStatus from '../seller/useSellerStatus';
import './Nav.css';
 
export default function Nav(){
  const navigate = useNavigate();
  
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
 
  const [count, setCount] = useState(cartManager.getCount());
  const [wishlistCount, setWishlistCount] = useState(0);
  const prevCountRef = useRef(count);
  const cartCountRef = useRef(null);
  const prevWishlistCountRef = useRef(0);
  const wishlistCountRef = useRef(null);
 
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const { seller, loading: sellerLoading, refetchSeller } = useSellerStatus();
  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

  const isSellerUser = seller && (seller.verification_status === "approved" || seller.is_active);


 
  /* CART COUNT */
  useEffect(() => {
    const unsub = cartManager.subscribe(() => {
      const newCount = cartManager.getCount();
      setCount(newCount);
      if (cartCountRef.current && newCount > prevCountRef.current) {
        cartCountRef.current.classList.add('pulse');
        setTimeout(() => cartCountRef.current?.classList.remove('pulse'), 700);
      }
      prevCountRef.current = newCount;
    });
    return unsub;
  }, []);

  async function fetchWishlistCount() {
    if (!currentUser) {
      setWishlistCount(0);
      prevWishlistCountRef.current = 0;
      return;
    }

    try {
      const res = await fetch(`${API_URL}/wishlist.php`, { credentials: 'include' });
      const data = await res.json();
      const newCount = data.success && Array.isArray(data.items) ? data.items.length : 0;
      setWishlistCount(newCount);
      if (wishlistCountRef.current && newCount > prevWishlistCountRef.current) {
        wishlistCountRef.current.classList.add('pulse');
        setTimeout(() => wishlistCountRef.current?.classList.remove('pulse'), 700);
      }
      prevWishlistCountRef.current = newCount;
    } catch (err) {
      setWishlistCount(0);
    }
  }

  useEffect(() => {
    fetchWishlistCount();

    const handleWishlistChange = (event) => {
      if (typeof event?.detail?.count === 'number') {
        const newCount = event.detail.count;
        setWishlistCount(newCount);
        prevWishlistCountRef.current = newCount;
        return;
      }
      fetchWishlistCount();
    };

    window.addEventListener('wishlistChange', handleWishlistChange);
    return () => window.removeEventListener('wishlistChange', handleWishlistChange);
  }, [currentUser]);
 
  /* AUTH - Only check for regular user, not admin or seller */
  useEffect(() => {
    const checkUserAuth = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
        const res = await fetch(`${API_URL}/check-auth.php`, {
          credentials: 'include'
        });
        const data = await res.json();
       
        // Only set user if it's a regular user (explicit user_type === 'user')
        if (data.authenticated && data.user && data.user_type === 'user') {
          setCurrentUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          // Check seller status for ALL authenticated users (not just 'user' type)
          if (data.authenticated) {
            try {
              const sres = await fetch(`${API_URL}/seller/check-auth.php`, { credentials: 'include' });
              const sdata = await sres.json();
              if (sdata && sdata.authenticated) {
                // refresh seller status hook
                try { refetchSeller?.(); } catch(e) {}
                return; // Exit early if seller is authenticated
              }
            } catch (e) {
              // Continue to regular user fallback
            }
            // Not a regular user — ensure localStorage doesn't hold admin data
            const localUser = localStorage.getItem('user');
            const adminStored = localStorage.getItem('admin_user');
            if (localUser) {
              try {
                const parsed = JSON.parse(localUser);
                if ((parsed.email && parsed.email.includes('admin')) || parsed.email === 'admin@themehub.com' || adminStored) {
                  localStorage.removeItem('user');
                  setCurrentUser(null);
                } else {
                  setCurrentUser(parsed);
                }
              } catch (err) {
                localStorage.removeItem('user');
                setCurrentUser(null);
              }
            } else {
              setCurrentUser(null);
            }
            // refresh seller status to ensure UI updates
            try { refetchSeller?.(); } catch(e) {}
          }
        }
      } catch (err) {
        // Fallback to localStorage, but do not use it if admin is logged in
        try {
          const raw = localStorage.getItem('user');
          const adminStored = localStorage.getItem('admin_user');
          if (raw && !adminStored) {
            const parsed = JSON.parse(raw);
            // Don't show admin emails
            if (parsed.email && !parsed.email.includes('admin') && parsed.email !== 'admin@themehub.com') {
              setCurrentUser(parsed);
            } else {
              localStorage.removeItem('user');
            }
          } else if (adminStored) {
            setCurrentUser(null);
          }
        } catch {}
      }
    };
 
    checkUserAuth();
   
    // Listen for auth changes
    const onAuth = (e) => {
      const user = e?.detail?.user;
      const userType = e?.detail?.user_type ?? null;
      // Only set if this is a regular user. If an admin event occurs, clear public user storage.
      if (user && (userType === 'user' || (!userType && !user.email?.includes('admin') && user.email !== 'admin@themehub.com'))) {
        setCurrentUser(user);
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        setCurrentUser(null);
        localStorage.removeItem('user');
        try { refetchSeller?.(); } catch(e) {}
      }
    };
   
    window.addEventListener('authChange', onAuth);
   
    return () => window.removeEventListener('authChange', onAuth);
  }, []);
 
  /* CLOSE MENUS ON ROUTE CHANGE */
  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';

    if (location.pathname === '/templates') {
      setNavSearch(q);
      return;
    }

    if (!q) {
      setNavSearch('');
    }
  }, [location.pathname, location.search]);
 
  /* CLOSE PROFILE DROPDOWN ON OUTSIDE CLICK */
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
 
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
 
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileOpen]);
 
  function doSearch(q){
    const t = (q || '').trim();
    const params = location.pathname === '/templates'
      ? new URLSearchParams(location.search)
      : new URLSearchParams();

    if (t) {
      params.set('q', t);
    } else {
      params.delete('q');
    }
    params.delete('page');

    const search = params.toString();
    navigate(search ? `/templates?${search}` : '/templates');
    setMobileOpen(false);
  }

  function goToWishlist() {
    navigate(currentUser ? '/wishlist' : '/login');
    setMobileOpen(false);
  }
 
  async function handleLogout(){
    try {
      const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
      await fetch(`${API_URL}/logout.php`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('authChange', { detail: { user: null } }));
    setCurrentUser(null);
    try {
      // Clear cart on logout so cart count resets to 0
      cartManager.clear();
    } catch (e) { /* ignore */ }
    navigate('/');
  }
 
  return (
    <nav className="navbar site-navbar">
      <div className="container site-navbar-container">
        <div className="nav-wrapper">
 
          {/* LOGO */}
          <Link to="/" className="logo">
            <img className="site-logo" src={logoImg} alt="ThemeHub Logo" />
          </Link>
 
          {/* LINKS */}
          <div className={`nav-links ${mobileOpen ? 'open' : ''}`}>
            
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
            <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>About</Link>
            <Link to="/templates" className={location.pathname === '/templates' || location.pathname.startsWith('/template/') ? 'active' : ''}>Templates</Link>
             <Link to="/allcategories" className={location.pathname === '/allcategories' || location.pathname.startsWith('/allcategories/') ? 'active' : ''}>Categories</Link>
            
            <Link to="/blog" className={location.pathname === '/blog' || location.pathname.startsWith('/blog/') ? 'active' : ''}>Blog</Link>
           
            <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>Contact</Link>
 
            {/* MOBILE */}
            {mobileOpen && currentUser && (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-green-600 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <i className="fas fa-user-circle"></i>
                  My Profile
                </Link>
                <Link
                  to="/support/tickets"
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-green-600 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <i className="fas fa-headset"></i>
                  Support Tickets
                </Link>
                <Link
                  to="/support/tickets/new"
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-green-600 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <i className="fas fa-plus-circle"></i>
                  Create Ticket
                </Link>
              </>
            )}

            <div className="mobile-nav-actions">
              <div className="mobile-search-box">
                <i className="fas fa-search" onClick={() => doSearch(navSearch)} />
                <input
                  value={navSearch}
                  onChange={e => setNavSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doSearch(navSearch)}
                  placeholder="Search templates..."
                />
                <button type="button" onClick={() => doSearch(navSearch)}>
                  Search
                </button>
              </div>

              <button
                type="button"
                className="mobile-cart-btn"
                onClick={() => {
                  navigate('/cart');
                  setMobileOpen(false);
                }}
              >
                <span>
                  <i className="fas fa-shopping-cart"></i>
                  Cart
                </span>
                <strong>{currentUser ? count : 0}</strong>
              </button>

              <button
                type="button"
                className="mobile-cart-btn mobile-wishlist-btn"
                onClick={goToWishlist}
              >
                <span>
                  <i className="fas fa-heart"></i>
                  Wishlist
                </span>
                <strong>{currentUser ? wishlistCount : 0}</strong>
              </button>

              {currentUser ? (
                <div className="mobile-auth-actions">
                  <button
                    type="button"
                    className="mobile-profile-btn"
                    onClick={() => {
                      navigate('/profile');
                      setMobileOpen(false);
                    }}
                  >
                    My Profile
                  </button>
                  <button
                    type="button"
                    className="mobile-login-btn"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="mobile-auth-actions">
                  <button
                    type="button"
                    className="mobile-register-btn"
                    onClick={() => {
                      navigate('/register');
                      setMobileOpen(false);
                    }}
                  >
                    Register
                  </button>
                  <button
                    type="button"
                    className="mobile-login-btn"
                    onClick={() => {
                      navigate('/login');
                      setMobileOpen(false);
                    }}
                  >
                    Login
                  </button>
                </div>
              )}
            </div>
          </div>
 
          {/* DESKTOP ACTIONS */}
          <div className="nav-actions">
            <div className="search-box">
              <i className="fas fa-search" onClick={() => doSearch(navSearch)} />
              <input
                value={navSearch}
                onChange={e => setNavSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch(navSearch)}
                placeholder="Search templates..."
              />
            </div>
 
            <button className="cart-btn" onClick={() => navigate('/cart')}>
              <i className="fas fa-shopping-cart"></i>
              <span ref={cartCountRef} className="cart-count">{currentUser ? count : 0}</span>
            </button>

            <button
              className="cart-btn wishlist-nav-btn"
              onClick={goToWishlist}
              title="My Wishlist"
              aria-label="My Wishlist"
            >
              <i className="fas fa-heart"></i>
              <span ref={wishlistCountRef} className="cart-count wishlist-count">{currentUser ? wishlistCount : 0}</span>
            </button>
 
           
 
            {currentUser ? (
              <>
                <span className="nav-user">Hi, {currentUser.full_name || currentUser.email}</span>
 
                {/* PROFILE DROPDOWN */}
                <div className="support-dropdown" ref={profileDropdownRef}>
                  <button
                    className="icon-btn"
                    onClick={() => setProfileOpen(s => !s)}
                    title="My Profile"
                    style={{ padding: '4px' }}
                  >
                    {currentUser.photo_url ? (
                      <img
                        src={currentUser.photo_url}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover border-2 border-green-600"
                      />
                    ) : (
                      <i className="fas fa-user-circle" style={{ fontSize: '28px', color: '#04733c' }}></i>
                    )}
                  </button>
 
                  {profileOpen && (
                    <div className="support-menu" style={{ minWidth: '200px', right: 0 }}>
                      <button onClick={() => { navigate('/profile'); setProfileOpen(false); }}>
                        <i className="fas fa-user mr-2"></i> My Profile
                      </button>
                      {isSellerUser && (
                        <button onClick={() => { navigate('/seller/account'); setProfileOpen(false); }}>
                          <i className="fas fa-id-badge mr-2"></i> Your Details
                        </button>
                      )}
                      <button onClick={() => { navigate('/purchases'); setProfileOpen(false); }}>
                        <i className="fas fa-shopping-bag mr-2"></i> Purchase History
                      </button>
                      <button onClick={() => { navigate('/wishlist'); setProfileOpen(false); }}>
                        <i className="fas fa-heart mr-2"></i> My Wishlist
                      </button>
                      <button onClick={() => { navigate('/support/tickets'); setProfileOpen(false); }}>
                        <i className="fas fa-headset mr-2"></i> Support Tickets
                      </button>
                      <button onClick={() => { navigate('/support/tickets/new'); setProfileOpen(false); }}>
                        <i className="fas fa-plus-circle mr-2"></i> Create Ticket
                      </button>

                 {/* Show "Become a Seller" ONLY if user is NOT a seller */}
{!sellerLoading && currentUser && !isSellerUser && (
  <button
    onClick={() => {
      navigate("/become-seller");
      setProfileOpen(false);
    }}
    style={{ color: "#04733c", fontWeight: 600 }}
  >
    <i className="fas fa-store mr-2"></i> Become a Seller
  </button>
)}

                      <hr style={{ margin: '8px 0', borderColor: '#e5e7eb' }} />
                      <button onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt mr-2"></i> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button className="btn-register" onClick={() => navigate('/register')}>Register</button>
                <button className="btn-login" onClick={() => navigate('/login')}>Login</button>
              </>
            )}
          </div>

          <div className="mobile-quick-actions">
            <button
              className="cart-btn wishlist-nav-btn"
              onClick={goToWishlist}
              title="My Wishlist"
              aria-label="My Wishlist"
            >
              <i className="fas fa-heart"></i>
              <span className="cart-count wishlist-count">{currentUser ? wishlistCount : 0}</span>
            </button>
            <button className="cart-btn" onClick={() => navigate('/cart')} title="Cart" aria-label="Cart">
              <i className="fas fa-shopping-cart"></i>
              <span className="cart-count">{currentUser ? count : 0}</span>
            </button>
          </div>
 
          {/* MOBILE TOGGLE */}
          <button
            className="nav-toggle"
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(s => !s)}
          >
            <span className="hamburger" />
          </button>
 
        </div>
      </div>
    </nav>
  );
}
 
 
