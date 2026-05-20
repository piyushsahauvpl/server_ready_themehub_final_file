import React from 'react'
import { Link } from 'react-router-dom'
import wpImg from '../assets/images/wordpress.jpg'
import '../assets/css/style.css'

export default function WordPress(){
  return (
    <main>

      <section style={{ padding: '2rem 0' }}>
        <div className="container">
          <div className="content-card" style={{ padding: 20, borderRadius: 12, background: 'var(--bg-primary)', boxShadow: 'var(--shadow-sm)' }}>
            <h2>WordPress Theme Example</h2>
            <div style={{ marginTop: 16 }}>
              <img src={wpImg} alt="WordPress category" style={{ width: '100%', borderRadius: 8, objectFit: 'cover' }} />
            </div>
            <div style={{ marginTop: 16 }}>
              <Link to="/templates" className="btn">Browse Templates</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
