import React, { useState } from 'react'
 
export default function RegisterPage({ onClose }){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
 
  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    setMessage(null)
    if(!name || !email || !password){
      setError('All fields are required')
      return
    }
    setLoading(true)
    try{
      const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/register.php` : 'https://uptulathemehub.com/backend/api/register.php'
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name, email, password }),
        credentials: 'include'
      })
      const data = await res.json()
      if(res.ok && data.success){
        setMessage('Registration successful. You can now log in')
        setTimeout(()=>{ onClose && onClose() }, 900)
      } else {
        setError(data.message || 'Registration failed')
      }
    } catch(err){
      setError('Server error')
    } finally {
      setLoading(false)
    }
  }
 
  return (
    <div className="register-page">
      <div className="container" style={{maxWidth:620, marginTop:40}}>
        <button onClick={onClose} style={{marginBottom:16}} className="btn-secondary">Back</button>
 
        <div className="modal-card" role="dialog" aria-modal="true">
          <div className="modal-inner">
            <div className="social-row">
              <button className="social-btn google"> <span>G</span> Google</button>
              <button className="social-btn twitter"> <span>x</span></button>
              <button className="social-btn facebook"> <span>f</span></button>
            </div>
 
            <div className="or-sep" style={{textAlign:'center', margin:'16px 0'}}><span>or</span></div>
 
            <form className="register-form" onSubmit={handleSubmit}>
              <label>
                <div className="field-label">Name</div>
                <input className="form-input" value={name} onChange={(e)=>setName(e.target.value)} name="name" placeholder="" />
              </label>
 
              <label>
                <div className="field-label">Mail or Username</div>
                <input className="form-input" value={email} onChange={(e)=>setEmail(e.target.value)} name="email" placeholder="" />
              </label>
 
              <label>
                <div className="field-label">Password</div>
                <input className="form-input" value={password} onChange={(e)=>setPassword(e.target.value)} type="password" name="password" placeholder="" />
              </label>
 
              <button className="btn register-btn" type="submit" disabled={loading}>{loading ? '...Registering' : 'Register'}</button>
            </form>
 
            {message && <div style={{color:'green', marginTop:8}}>{message}</div>}
            {error && <div style={{color:'red', marginTop:8}}>{error}</div>}
 
            <div className="modal-footer" style={{marginTop:12}}>Already have an account? <a href="#" onClick={(e)=>{e.preventDefault(); onClose && onClose()}}>Sign In</a></div>
          </div>
        </div>
      </div>
    </div>
  )
}
