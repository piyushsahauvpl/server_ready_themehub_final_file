import React, { useEffect, useRef, useState } from "react";
import "../assets/css/style.css";

export default function LoginModal({ onClose }) {
  const overlayRef = useRef(null);
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState(null)
  const [forgotMessage, setForgotMessage] = useState(null)

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose && onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function onOverlayClick(e) {
    if (e.target === overlayRef.current) {
      onClose && onClose();
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    setForgotError(null)
    setForgotMessage(null)

    if (!forgotEmail || !forgotNewPassword || !forgotConfirmPassword) {
      setForgotError('All fields are required')
      return
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match')
      return
    }

    if (forgotNewPassword.length < 6) {
      setForgotError('Password must be at least 6 characters')
      return
    }

    setForgotLoading(true)
    try {
      const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

      const res = await fetch(`${API_URL}/forgot-password.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotEmail,
          new_password: forgotNewPassword,
          confirm_password: forgotConfirmPassword
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setForgotMessage('Password updated successfully! You can now login.')
        setTimeout(() => {
          setShowForgotPassword(false)
          setForgotEmail('')
          setForgotNewPassword('')
          setForgotConfirmPassword('')
        }, 2000)
      } else {
        setForgotError(data.message || 'Failed to reset password')
      }
    } catch (err) {
      console.error('Forgot password error:', err)
      setForgotError('Server error. Please try again later.')
    } finally {
      setForgotLoading(false)
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!email || !password) { setError('Email and password are required'); return }
    setLoading(true)
    try {
      const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

      const res = await fetch(`${API_URL}/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email,
          password: password,
          remember_me: rememberMe
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setMessage('Logged in successfully')

        try {
          const userData = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.full_name,
            full_name: data.user.full_name,
            role: data.user.role
          }

          // ✅ FIX: Save user data
          localStorage.setItem('user', JSON.stringify(userData))

          // ✅ FIX: Store token under the correct key based on user role
          // This ensures TicketMessages uses the right token per role
          if (data.token) {
            const role = data.user.role; // e.g. "USER", "SELLER", "CUSTOMER_SUPPORT", "ADMIN"

            // Always save as 'auth_token' — universal key used everywhere
            localStorage.setItem('auth_token', data.token);

            // Also save role-specific key for backward compatibility
            if (role === 'CUSTOMER_SUPPORT' || role === 'ADMIN') {
              localStorage.setItem('cs_token', data.token);
              // Clear user token if switching roles
              localStorage.removeItem('user_token');
            } else {
              // USER, SELLER
              localStorage.setItem('user_token', data.token);
              // Clear cs_token so it's never accidentally used for regular users
              localStorage.removeItem('cs_token');
            }
          }

          // Notify other parts of the app
          window.dispatchEvent(new CustomEvent('authChange', { detail: { user: data.user } }))

          // Verify session then redirect
          setTimeout(async () => {
            try {
              const verifyRes = await fetch(`${API_URL}/check-auth.php`, {
                credentials: 'include'
              })
              const verifyData = await verifyRes.json()

              if (verifyData.authenticated) {
                onClose && onClose()
                if (window.location.pathname === '/login') {
                  window.location.href = '/profile'
                }
              } else {
                console.warn('Session verification failed, retrying...')
                setTimeout(() => {
                  onClose && onClose()
                }, 500)
              }
            } catch (verifyErr) {
              console.error('Session verification error:', verifyErr)
              onClose && onClose()
            }
          }, 500)

        } catch (e) {
          console.error('Error saving user data:', e)
          setTimeout(() => { onClose && onClose() }, 700)
        }
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Server error. Please try again later.')
    } finally { setLoading(false) }
  }

  return (
    <div className="simple-modal-overlay" ref={overlayRef} onMouseDown={onOverlayClick}>
      <div className="simple-modal-card" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <button className="simple-modal-close" aria-label="Close" onClick={() => {
          if (showForgotPassword) {
            setShowForgotPassword(false)
          } else {
            onClose && onClose()
          }
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="simple-modal-content">
          {!showForgotPassword ? (
            <>
              <div className="simple-modal-header">
                <h2>Welcome Back</h2>
                <p>Sign in to your account</p>
              </div>

              <form onSubmit={handleLogin} className="simple-form">
                <div className="simple-form-group">
                  <label>Email Address</label>
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    type="email"
                    placeholder="Enter your email"
                    className="simple-input"
                    required
                  />
                </div>

                <div className="simple-form-group">
                  <label>Password</label>
                  <input
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    type="password"
                    placeholder="Enter your password"
                    className="simple-input"
                    required
                  />
                </div>

                <div className="simple-form-options">
                  <label className="simple-checkbox">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="simple-link" onClick={(e) => {
                    e.preventDefault()
                    setShowForgotPassword(true)
                  }}>Forgot Password?</a>
                </div>

                {message && <div className="simple-message success">{message}</div>}
                {error && <div className="simple-message error">{error}</div>}

                <button className="simple-btn" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="simple-modal-footer">
                <p>Don&apos;t have an account? <a href="#" onClick={(e) => { e.preventDefault(); onClose && onClose(); window.location.href = '/register' }}>Sign up</a></p>
              </div>
            </>
          ) : (
            <>
              <div className="simple-modal-header">
                <h2>Reset Password</h2>
                <p>Enter your email and new password</p>
              </div>

              <form onSubmit={handleForgotPassword} className="simple-form">
                <div className="simple-form-group">
                  <label>Email Address</label>
                  <input
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    type="email"
                    placeholder="Enter your email"
                    className="simple-input"
                    required
                  />
                </div>

                <div className="simple-form-group">
                  <label>New Password</label>
                  <input
                    value={forgotNewPassword}
                    onChange={e => setForgotNewPassword(e.target.value)}
                    type="password"
                    placeholder="Enter new password"
                    className="simple-input"
                    required
                  />
                </div>

                <div className="simple-form-group">
                  <label>Confirm Password</label>
                  <input
                    value={forgotConfirmPassword}
                    onChange={e => setForgotConfirmPassword(e.target.value)}
                    type="password"
                    placeholder="Confirm new password"
                    className="simple-input"
                    required
                  />
                </div>

                {forgotMessage && <div className="simple-message success">{forgotMessage}</div>}
                {forgotError && <div className="simple-message error">{forgotError}</div>}

                <button className="simple-btn" disabled={forgotLoading}>
                  {forgotLoading ? 'Updating...' : 'Update Password'}
                </button>

                <button
                  type="button"
                  className="simple-btn"
                  onClick={() => setShowForgotPassword(false)}
                  style={{ marginTop: '10px', backgroundColor: '#999' }}
                >
                  Back to Login
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}