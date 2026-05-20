import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Featured.css'
import { Helmet } from "./SeoHelmet"; 

export default function Featured() {
  const navigate = useNavigate()

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
    <section className="offer-section">
      <div className="offer-banner">
        <div className="offer-copy">
          <span className="offer-pill">Built for Creators</span>
          <h2>Premium Themes &amp; Plugins for a Stunning Website!</h2>
          <p className="offer-desc">
            Modern Design, Powerful Features &amp; Easy Customization.
          </p>

          <div className="offer-action-row">
            <button className="offer-button" type="button" onClick={() => navigate('/templates')}>
              Explore Themes <i className="fas fa-arrow-right"></i>
            </button>
          </div>

          <div className="offer-feature-list">
            <div className="offer-feature">
              <i className="fas fa-shield-alt"></i>
              <span>100% Secure &amp; Updated</span>
            </div>
            <div className="offer-feature">
              <i className="fas fa-palette"></i>
              <span>Modern &amp; Responsive</span>
            </div>
            <div className="offer-feature">
              <i className="fas fa-cog"></i>
              <span>Easy to Use &amp; Customize</span>
            </div>
          </div>
        </div>

        <div className="offer-art" aria-hidden="true">
          <div className="offer-visual-shell">
            <img className="offer-main-image" src="/images/main.png" alt="Theme preview" />
            <img className="offer-card offer-card-one" src="/images/card1.png" alt="Theme card" />
            <img className="offer-card offer-card-two" src="/images/card2.png" alt="Theme card" />
            <div className="offer-badge-panel">
              <div className="offer-badge-icon">
                <i className="fas fa-rocket"></i>
              </div>
              <div className="offer-badge-copy">
                <strong>Build Better. Faster.</strong>
                <span>Designed for Performance</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  )
}
