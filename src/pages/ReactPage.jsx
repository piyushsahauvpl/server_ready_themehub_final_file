import React from 'react'
import { Link } from 'react-router-dom'
import reactImg from '../assets/images/react.jpg'
import '../assets/css/style.css'

export default function ReactPage(){
  return (
    <main>

      <section style={{ padding: '2rem 0' }}>
        <div className="container">
          <div className="content-card" style={{ padding: 20, borderRadius: 12, background: 'var(--bg-primary)', boxShadow: 'var(--shadow-sm)' }}>
            <h2>React Template Example</h2>
            <div style={{ marginTop: 16 }}>
              <img src={reactImg} alt="React category" style={{ width: '100%', borderRadius: 8, objectFit: 'cover' }} />
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
