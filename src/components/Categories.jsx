import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import './Categories.css'
import { Helmet } from "./SeoHelmet"; 
const CategoryCard = ({icon, iconClass, title, subtitle, accent, onClick}) => (
    <>
    <Helmet>
      <title>
        WordPress Themes & Website Templates | Uptula Theme Hub
      </title>

      <meta
        name="description"
        content="Find the best WordPress theme or website template for your next project. Browse Uptula Theme Hub's premium collection — clean, modern, and easy to customize."
      />
    </Helmet>
  <motion.div
    className="category-card"
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onClick && onClick()
      }
    }}
    style={{ '--category-accent': accent, cursor: onClick ? 'pointer' : 'default' }}
    variants={{
      hidden: { opacity: 0, y: 22 },
      show: { opacity: 1, y: 0 },
    }}
    whileHover={{ y: -8 }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
  >
    <div className="category-card-glow"></div>
    <div className="category-icon" aria-hidden="true">
      {icon ? icon : iconClass ? <i className={iconClass}></i> : (
        <div className="cat-letter" aria-hidden="true">{title ? title.slice(0,2).toUpperCase() : ''}</div>
      )}
    </div>
    <div className="category-copy">
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
    <span className="category-arrow" aria-hidden="true">
      <i className="fas fa-arrow-right"></i>
    </span>
  </motion.div>
  </>
)

export default function Categories(){
  const navigate = useNavigate()

  const cats = [
    { title: 'WordPress', tag: 'wordpress', subtitle: '2,500+ themes', accent: '#08a950', icon: (
      <svg width="56" height="56" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <circle cx="32" cy="32" r="30" fill="#04753d" />
        <text x="32" y="38" textAnchor="middle" fontFamily="Poppins, Arial" fontWeight="700" fontSize="28" fill="#fff">W</text>
      </svg>
    )},
    { title: 'React', tag: 'react', subtitle: '1,800+ templates', accent: '#17a6d8', icon: (
      <svg width="56" height="56" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <linearGradient id="rg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#61dafb" />
            <stop offset="1" stopColor="#7b61ff" />
          </linearGradient>
        </defs>
        <g transform="translate(32,32)">
          <ellipse rx="18" ry="6" fill="none" stroke="url(#rg)" strokeWidth="3" transform="rotate(0)" />
          <ellipse rx="18" ry="6" fill="none" stroke="url(#rg)" strokeWidth="3" transform="rotate(60)" />
          <ellipse rx="18" ry="6" fill="none" stroke="url(#rg)" strokeWidth="3" transform="rotate(120)" />
          <circle cx="0" cy="0" r="4" fill="url(#rg)" />
        </g>
      </svg>
    )},
    { title: 'HTML/CSS', tag: 'html', subtitle: '3,200+ templates', accent: '#f97316', icon: (
      <svg width="56" height="56" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect x="6" y="8" width="52" height="48" rx="6" fill="#ef652a" />
        <text x="32" y="38" textAnchor="middle" fontFamily="Poppins, Arial" fontWeight="800" fontSize="18" fill="#fff">HTML</text>
      </svg>
    )},
    { title: 'UI Kits', tag: 'ui', subtitle: '1,500+ kits', accent: '#8b5cf6', icon: (
      <svg width="56" height="56" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect x="10" y="12" width="14" height="14" rx="3" fill="#8b5cf6" opacity=".9" />
        <rect x="40" y="12" width="14" height="14" rx="3" fill="#a78bfa" />
        <rect x="10" y="38" width="14" height="14" rx="3" fill="#c4b5fd" />
        <rect x="40" y="38" width="14" height="14" rx="3" fill="#7c3aed" opacity=".9" />
      </svg>
    )},
    { title: 'Dashboards', tag: 'dashboard', subtitle: '900+ templates', accent: '#2563eb', icon: (
      <svg width="56" height="56" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect x="8" y="36" width="12" height="18" rx="2" fill="#60a5fa" />
        <rect x="26" y="24" width="12" height="30" rx="2" fill="#3b82f6" />
        <rect x="44" y="16" width="12" height="38" rx="2" fill="#1d4ed8" />
      </svg>
    )},
    { title: 'Landing Pages', tag: 'landing', subtitle: '2,100+ pages', accent: '#f59e0b', icon: (
      <svg width="56" height="56" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect x="10" y="10" width="44" height="44" rx="6" fill="#fff3cd" stroke="#f59e0b" strokeWidth="1" />
        <rect x="18" y="18" width="28" height="8" rx="2" fill="#f59e0b" />
        <rect x="18" y="30" width="18" height="6" rx="2" fill="#f59e0b" opacity="0.85" />
        <rect x="18" y="38" width="10" height="4" rx="2" fill="#f59e0b" opacity="0.7" />
      </svg>
    )},
    { title: 'E-Commerce', tag: 'ecommerce', subtitle: '1,400+ stores', accent: '#ef4444', icon: (
      <svg width="56" height="56" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M16 22h32l-3 22H19z" fill="#f3f4f6" />
        <path d="M22 18a4 4 0 118 0" fill="#f97316" />
        <circle cx="26" cy="46" r="2" fill="#374151" />
        <circle cx="42" cy="46" r="2" fill="#374151" />
      </svg>
    )},
    { title: 'Mobile Apps', tag: 'mobile', subtitle: '800+ designs', accent: '#6366f1', icon: (
      <svg width="56" height="56" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect x="20" y="10" width="24" height="44" rx="4" fill="#eef2ff" stroke="#6366f1" strokeWidth="1" />
        <rect x="26" y="18" width="12" height="6" rx="2" fill="#6366f1" />
        <rect x="26" y="28" width="12" height="10" rx="2" fill="#a78bfa" opacity="0.9" />
      </svg>
    )},
  ]

  return (
    <motion.section
      className="categories-section"
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="categories-container">
        <motion.div
          className="categories-header"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.48 }}
        >
          <span className="categories-pill">+ Explore Categories</span>
          <h2>Browse Themes by <span>Popular Categories</span></h2>
          <p>Choose the perfect starting point for your next website, store, dashboard, or app.</p>
        </motion.div>

        <motion.div
          className="categories-grid"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.18 }}
        >
          {cats.map((c) => (
            <CategoryCard
              key={c.tag}
              title={c.title}
              subtitle={c.subtitle}
              icon={c.icon}
              accent={c.accent}
              onClick={() => navigate(`/templates?category=${encodeURIComponent(c.tag)}`)}
            />
          ))}
        </motion.div>
      </div>
    </motion.section>
  )
}
