import React, { useEffect, useRef } from 'react'
 
const ICONS = {
  account: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 21a8 8 0 10-16 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  search: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="11" cy="11" r="5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  edit: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 21v-3.75L14.06 6.19l3.75 3.75L6.75 21H3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.14 5.86l-1-1a2 2 0 00-2.83 0l-1 1 3.75 3.75 1-1a2 2 0 000-2.83z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  card: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M2 10h20" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  )
}
 
export default function HowItWorks(){
  const steps = [
    {
      title: 'Create Account',
      desc: 'Sign up to access all features.',
      extra: 'Create your free account in seconds — use email or continue with Google. Your account stores purchases, favorites, and license keys so you can download anytime.',
      icon: ICONS.account
    },
    {
      title: 'Browse Templates',
      desc: 'Discover curated templates fast.',
      extra: 'Filter by category, price, and compatibility. Preview live demos and read reviews to pick the best match for your project.',
      icon: ICONS.search
    },
    {
      title: 'Customize & Preview',
      desc: 'Edit and preview before you buy.',
      extra: 'Use the built-in customizer to tweak colors and assets. Preview across device sizes to ensure perfect fit before checkout.',
      icon: ICONS.edit
    },
    {
      title: 'Purchase & Download',
      desc: 'Secure checkout and instant download.',
      extra: 'Complete a fast, secure checkout and download immediately. Licenses and download links are available in your account dashboard.',
      icon: ICONS.card
    },
  ]
 
  const containerRef = useRef(null)
 
  useEffect(()=>{
    const root = containerRef.current
    if(!root) return
 
    const items = Array.from(root.querySelectorAll('.timeline-item'))
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('in-view')
          // keep visible once revealed
          obs.unobserve(entry.target)
        }
      })
    },{threshold:0.35})
 
    items.forEach(i=>obs.observe(i))
    return ()=>obs.disconnect()
  },[])
 
  return (
    <section className="how how-creative">
      <div className="container">
        <h2>How It Works</h2>
        <p className="muted">A friendly 4-step process to get you from discovery to download.</p>
 
        <div className="timeline" aria-hidden ref={containerRef}>
          <div className="timeline-line" />
          {steps.map((s, i) => (
            <div key={i} className="timeline-item">
              <div className="timeline-marker" aria-hidden>
                <span className="marker-num">{i + 1}</span>
              </div>
 
              <div className="timeline-card">
                <div className="timeline-icon" aria-hidden>{s.icon}</div>
                <h4>{s.title}</h4>
                <p className="muted">{s.desc}</p>
                {s.extra && <p className="detail">{s.extra}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
 
 
