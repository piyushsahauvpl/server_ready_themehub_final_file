import React, { useRef, useEffect, useCallback, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import productStore from '../lib/productStore'
import { CartContext } from './CartContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { createCartItem, formatDisplayPrice } from '../lib/currency'
import { getTemplateUrl } from '../lib/slug'
import '../assets/css/style.css'
import './LatestTemplates.css'
import { Helmet } from "./SeoHelmet"; 

export default function LatestTemplates({ view = 'carousel', category = 'all', showTitle = true }) {
  const navigate = useNavigate()
  const { addToCart } = useContext(CartContext)
  const currencyContext = useCurrency()
  const activeCurrency = currencyContext.currency || 'INR'
  const containerRef = useRef(null)
  const [scrollAmount, setScrollAmount] = useState(360)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)

  const getFrameworkIcon = (frameworkName) => {
    if (!frameworkName) return 'R'
    const name = frameworkName.toLowerCase()
    if (name.includes('react')) return 'R'
    if (name.includes('vue')) return 'V'
    if (name.includes('angular')) return 'A'
    if (name.includes('wordpress')) return 'W'
    if (name.includes('html') || name.includes('css')) return 'H'
    return frameworkName.charAt(0).toUpperCase()
  }

  const handleAddToCart = (e, item) => {
    e.stopPropagation()
    addToCart(createCartItem(item))
  }

  useEffect(() => {
    let mounted = true
    setLoading(true)

    const API_URL = process.env.REACT_APP_API_URL || 'https://uptulathemehub.com/backend/api'

    const currencyParam = `currency=${encodeURIComponent(activeCurrency)}`

    console.log('[LatestTemplates] Fetching with currency:', { activeCurrency, currencyParam })

    fetch(`${API_URL}/latest-products.php?${currencyParam}`, { credentials: 'include' })
      .then(r => r.json())
      .then(json => {
        if (!mounted) return
        console.log('[LatestTemplates] API Response:', { hasSuccess: json.success, dataLength: json.data?.length, firstItemCurrency: json.data?.[0]?.currency, firstItemSymbol: json.data?.[0]?.currency_symbol, firstItemPrice: json.data?.[0]?.price, firstItemConverted: json.data?.[0]?.converted_price })
        if (json.success && json.data && Array.isArray(json.data) && json.data.length > 0) {
          setItems(json.data)
          setLoading(false)
          return
        }

        fetch(`${API_URL}/products.php?limit=20&${currencyParam}`, { credentials: 'include' })
          .then(r => r.json())
          .then(json => {
            if (!mounted) return
            if (json.success && json.data && Array.isArray(json.data)) {
              setItems(json.data)
            } else {
              setFetchError('No products found')
            }
          })
          .catch(() => setFetchError('Failed to load products'))
          .finally(() => setLoading(false))
      })
      .catch(() => {
        console.warn('[LatestTemplates] Latest products API failed, trying products API')
        fetch(`${API_URL}/products.php?limit=20&${currencyParam}`, { credentials: 'include' })
          .then(r => r.json())
          .then(json => {
            if (!mounted) return
            if (json.success && json.data && Array.isArray(json.data)) {
              setItems(json.data)
            } else {
              setFetchError('No products found')
            }
          })
          .catch(() => setFetchError('Failed to load products'))
          .finally(() => setLoading(false))
      })

    return () => (mounted = false)
  }, [activeCurrency])

  const computeScrollAmount = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    setScrollAmount(container.clientWidth)
  }, [])

  useEffect(() => {
    computeScrollAmount()
    const container = containerRef.current
    if (!container) return

    const onScroll = () => {
      const canScroll = container.scrollWidth > container.clientWidth + 4
      setShowLeft(canScroll && container.scrollLeft > 6)
      setShowRight(canScroll && (container.scrollLeft + container.clientWidth) < container.scrollWidth - 6)
    }

    onScroll()
    window.addEventListener('resize', computeScrollAmount)
    container.addEventListener('scroll', onScroll)

    return () => {
      window.removeEventListener('resize', computeScrollAmount)
      container.removeEventListener('scroll', onScroll)
    }
  }, [computeScrollAmount, items.length])

  const scrollLeft = () =>
    containerRef.current?.scrollBy({ left: -scrollAmount, behavior: 'smooth' })

  const scrollRight = () =>
    containerRef.current?.scrollBy({ left: scrollAmount, behavior: 'smooth' })

  const openTemplate = (item) => {
    try { productStore.set(item) } catch (e) {}
    if (item.id != null || item.slug) {
      navigate(getTemplateUrl(item))
    }
  }

  const cleanCategory = (item) => {
    const raw = item.category_name || item.category || item.description || 'Business, Corporate'
    const text = String(raw).replace(/<[^>]+>/g, '').trim()
    return text.length > 34 ? `${text.slice(0, 34)}...` : text
  }

  const displayItems = category === 'all'
    ? items
    : items.filter(item => {
        const value = `${item.category || ''} ${item.category_name || ''} ${item.framework_name || ''}`.toLowerCase()
        return value.includes(category.toLowerCase())
      })

  return (
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
    <motion.section
      className={`lt-section lt-view-${view}`}
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="lt-container">
        {showTitle && (
          <motion.div
            className="lt-heading"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.46 }}
          >
            <span className="lt-pill">+ Browse Our Themes</span>
            <h2>Premium <span>Themes</span> for Every <span>Niche</span></h2>
            {/* <p>Find the perfect theme for your business, portfolio, blog or eCommerce store.</p> */}
          </motion.div>
        )}

        {showLeft && (
          <button className="lt-nav lt-nav-left" onClick={scrollLeft} aria-label="Previous templates">
            <i className="fas fa-chevron-left"></i>
          </button>
        )}

        <div className="lt-carousel" ref={containerRef}>
          {loading && <div className="lt-message">Loading...</div>}
          {fetchError && <div className="lt-message">{fetchError}</div>}

          {displayItems.map((item, index) => (
            <motion.article
              className="lt-card"
              key={item.id || item.slug || item.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.42, delay: Math.min(index, 5) * 0.06 }}
              whileHover={{ y: -7 }}
            >
              <div className="lt-thumb" onClick={() => openTemplate(item)}>
                <img
                  src={item.image || item.image_url || 'https://via.placeholder.com/420x260?text=Theme+Preview'}
                  alt={item.title || item.name || 'Theme preview'}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/420x260?text=Theme+Preview'
                  }}
                />
                <span className="lt-logo-dot">{getFrameworkIcon(item.framework_name)}</span>
              </div>

              <div className="lt-body">
                <h4 onClick={() => openTemplate(item)}>{item.title || item.name}</h4>

                <div className="lt-meta-row">
                  <p>{cleanCategory(item)}</p>
                  <strong>{formatDisplayPrice(item, currencyContext)}</strong>
                </div>

                <div className="lt-actions">
                  <button className="lt-demo-btn" type="button" onClick={() => openTemplate(item)}>
                    Live Demo
                  </button>
                  <button
                    className="lt-cart-btn"
                    type="button"
                    onClick={(e) => handleAddToCart(e, item)}
                    aria-label={`Add ${item.title || item.name || 'template'} to cart`}
                  >
                    <i className="fas fa-shopping-cart"></i>
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {showRight && (
          <button className="lt-nav lt-nav-right" onClick={scrollRight} aria-label="Next templates">
            <i className="fas fa-chevron-right"></i>
          </button>
        )}

        <div className="lt-footer">
          <motion.button className="lt-view-all" type="button" onClick={() => navigate('/templates')} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            View All Themes <i className="fas fa-arrow-right"></i>
          </motion.button>
        </div>
      </div>
    </motion.section>
    </>
  )
}
