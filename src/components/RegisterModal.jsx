import React, { useEffect, useRef, useState } from 'react'
import "../assets/css/style.css";
 
export default function RegisterModal({ onClose }){
  const overlayRef = useRef(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  
  // Password strength checker
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { strength: 0, label: '', color: '' }
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[a-z]/.test(pwd)) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++
    
    if (strength <= 2) return { strength, label: 'Weak', color: 'red' }
    if (strength <= 3) return { strength, label: 'Medium', color: 'orange' }
    return { strength, label: 'Strong', color: 'green' }
  }
  
  const passwordStrength = getPasswordStrength(password)
 
  useEffect(()=>{
    function onKey(e){
      if(e.key === 'Escape') onClose && onClose()
    }
    document.addEventListener('keydown', onKey)
    return ()=>document.removeEventListener('keydown', onKey)
  },[onClose])
 
  function onOverlayClick(e){
    if(e.target === overlayRef.current){
      onClose && onClose()
    }
  }
 
  async function handleRegister(e){
    e.preventDefault()
    setError(null)
    setMessage(null)
 
    if(!fullName || !email || !password){
      setError('All fields are required')
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number')
      return
    }
 
    setLoading(true)
    try{
      const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
      
      const res = await fetch(`${API_URL}/register.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          password: password
        })
      })

      const data = await res.json()
      
      if(res.ok && data.success){
        setMessage('Registration successful — you can now log in')
        // Clear form
        setFullName('')
        setEmail('')
        setPassword('')
        // Close modal after short delay
        setTimeout(()=>{ onClose && onClose() }, 1500)
      } else {
        setError(data.message || 'Registration failed')
      }
    } catch(err){
      console.error('Registration error:', err)
      setError('Server error. Please try again later.')
    } finally {
      setLoading(false)
    }
  }
 
  return (
    <div className="simple-modal-overlay" ref={overlayRef} onMouseDown={onOverlayClick}>
      <div className="simple-modal-card" role="dialog" aria-modal="true" onMouseDown={(e)=>e.stopPropagation()}>
        <button className="simple-modal-close" aria-label="Close" onClick={()=>onClose && onClose()}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
 
        <div className="simple-modal-content">
          <div className="simple-modal-header">
            <h2>Create Account</h2>
            <p>Join us and get started</p>
          </div>
 
          <form onSubmit={handleRegister} className="simple-form">
            <div className="simple-form-group">
              <label>Full Name</label>
              <input 
                value={fullName} 
                onChange={(e)=>setFullName(e.target.value)} 
                type="text" 
                placeholder="Enter your full name" 
                className="simple-input" 
                required
              />
            </div>
 
            <div className="simple-form-group">
              <label>Email Address</label>
              <input 
                value={email} 
                onChange={(e)=>setEmail(e.target.value)} 
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
                onChange={(e)=>setPassword(e.target.value)} 
                type="password" 
                placeholder="Create a password (min 8 characters)" 
                className="simple-input" 
                required
              />
              {password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          passwordStrength.color === 'red' ? 'bg-red-500' :
                          passwordStrength.color === 'orange' ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.color === 'red' ? 'text-red-600' :
                      passwordStrength.color === 'orange' ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Must contain uppercase, lowercase, and number
                  </p>
                </div>
              )}
            </div>
 
            <div className="simple-form-options">
              <label className="simple-checkbox">
                <input type="checkbox" />
                <span>I agree to the terms of service</span>
              </label>
            </div>
 
            {message && <div className="simple-message success">{message}</div>}
            {error && <div className="simple-message error">{error}</div>}
 
            <button className="simple-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
 
          <div className="simple-modal-footer">
            <p>Already have an account? <a href="#" onClick={(e)=>{e.preventDefault(); onClose && onClose(); window.location.href = '/login'}}>Sign in</a></p>
          </div>
        </div>
      </div>
    </div>
  )
}
