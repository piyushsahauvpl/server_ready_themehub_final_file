import React from "react";
import { motion } from "framer-motion";
import "./Hero.css";
import { Link, useLocation } from "react-router-dom";
import { Helmet } from "./SeoHelmet";      

const features = [
  {
    title: "Modern & Responsive",
    text: "Looks great on all devices",
    icon: "fa-display",
  },
  {
    title: "Easy Customization",
    text: "No coding required",
    icon: "fa-wand-magic-sparkles",
  },
  {
    title: "Regular Updates",
    text: "Always up to date",
    icon: "fa-rotate",
  },
  {
    title: "Dedicated Support",
    text: "We're here for you",
    icon: "fa-headset",
  },
];

const Hero = () => {
  // Get public URL for images - handles both dev and production
  const publicUrl = process.env.PUBLIC_URL || '';
  const imgBase = `${publicUrl}/images`;
  
  const location = useLocation();

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
      className="hero-redesign"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="hero-bg hero-bg-one"></div>
      <div className="hero-bg hero-bg-two"></div>
      <div className="hero-bg hero-bg-grid"></div>

      <div className="hero-container">
        <div className="hero-content">
          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, x: -34 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="hero-pill">+ Premium WordPress Themes</span>

            <h1>
              Create Stunning Websites with{" "}
              <span>Uptula Theme Hub</span>
            </h1>

            <p className="hero-description">
              Discover a wide collection of modern, responsive and highly customizable WordPress themes for your next project.
            </p>

            <div className="hero-feature-grid">
              {features.map((feature, index) => (
                <motion.div
                  className="hero-feature"
                  key={feature.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.42, delay: 0.24 + index * 0.08 }}
                  whileHover={{ y: -4 }}
                >
                  <span className="hero-feature-icon">
                    <i className={`fas ${feature.icon}`}></i>
                  </span>
                  <span>
                    <strong>{feature.title}</strong>
                    <small>{feature.text}</small>
                  </span>
                </motion.div>
              ))}
            </div>

          
          </motion.div>

          <motion.div
            className="hero-visual"
            aria-label="Theme preview showcase"
            initial={{ opacity: 0, x: 34 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="hero-preview-shell"
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 180, damping: 22 }}
            >
              <img src={`${imgBase}/main.png`} alt="Main theme preview" className="hero-main-preview" onError={(e) => {e.target.style.display = 'block'; console.log('Image load failed:', e.target.src);}} />
              <img src={`${imgBase}/card1.png`} alt="Theme card preview" className="hero-float-card hero-card-one" onError={(e) => {e.target.style.display = 'block'; console.log('Card1 load failed');}} />
              <img src={`${imgBase}/card2.png`} alt="Mobile theme preview" className="hero-float-card hero-card-two" onError={(e) => {e.target.style.display = 'block'; console.log('Card2 load failed');}} />
              <img src={`${imgBase}/card3.png`} alt="Website theme preview" className="hero-float-card hero-card-three" onError={(e) => {e.target.style.display = 'block'; console.log('Card3 load failed');}} />

              <div className="hero-badge-card">
                <strong>50+</strong>
                <span>Premium<br />Themes</span>
              </div>

              <div className="hero-sales-card">
                <i className="fas fa-bolt"></i>
                <div>
                  <strong>Fast Setup</strong>
                  <span>Launch-ready designs</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="hero-visual-actions"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.48, delay: 0.46 }}
            >
              <motion.div className="hero-cta text-white" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <Link to="/templates" className={location.pathname === '/templates' || location.pathname.startsWith('/template/') ? 'active' : ''}>
                  Explore Themes <i className="fas fa-arrow-right"></i>
                </Link>
              </motion.div>

              <div className="hero-trust">
                <div className="hero-avatar-stack" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div>
                  <p>Trusted by 10,000+ customers worldwide</p>
                  <div className="hero-rating">
                    <span>★★★★★</span>
                    <strong>4.9/5 (2,500+ Reviews)</strong>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.section>
     </>
  );
};

export default Hero;
