import React from "react";
import { Link } from "react-router-dom";
import "../assets/css/style.css";
import "./Templates.css";
import "./About.css";
import aboutBannerImage from "../assets/images/aboutimg.png";
import { Helmet } from "../components/SeoHelmet"; 

export default function About() {
  return (


     <>
      <Helmet>
        <title>
          About Uptula Theme Hub | SEO Optimized website Themes
        </title>
        <meta
          name="description"
          content="We build SEO optimized website themes to help your site rank on Google fast. Discover Uptula Theme Hub — where great design meets powerful search performance."
        />
      </Helmet>

    <main className="about-page">
      <section className="templates-banner about-banner">
        <div className="container banner-content">
          <div className="templates-banner-copy">
            <span className="templates-banner-label">About Us</span>
            <h1>Designing premium website themes with a human touch</h1>
            <p className="lead">Theme Hub helps creators, agencies and small businesses launch beautiful websites faster with modern, responsive templates designed for growth.</p>
          </div>
          <div className="about-banner-visual" aria-hidden="true">
            <img src={aboutBannerImage} alt="" />
          </div>
          <div className="templates-banner-card">
            <div className="templates-banner-card-top">
              <span>Why choose Theme Hub?</span>
              <strong>Quality & Speed</strong>
            </div>
            <div className="templates-banner-card-info">
              <div>
                <p>Premium Designs</p>
                <strong>Professional templates</strong>
              </div>
              <div>
                <p>Fast Setup</p>
                <strong>Launch in minutes</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-content">
        <div className="container about-grid">
          <div className="about-card">
            <div className="card-icon">🎯</div>
            <div className="card-badge">Our Mission</div>
            <h2>Empower every website owner</h2>
            <p>
              We create elegant digital products that make website building intuitive, fast and beautiful.
              Every theme is crafted for performance, accessibility and modern branding.
            </p>
          </div>
          <div className="about-card accent-card">
            <div className="card-icon">🚀</div>
            <div className="card-badge">Our Vision</div>
            <h2>Make premium design available to all</h2>
            <p>
              Our goal is to offer a polished online presence for every business, without the need for a developer.
              From startups to agencies, we deliver quality and confidence.
            </p>
          </div>
          <div className="about-card">
            <div className="card-icon">🤝</div>
            <div className="card-badge">Our Promise</div>
            <h2>Support that actually helps</h2>
            <p>
              We stand behind every product with dedicated help, regular updates, and easy integrations for your
              growing brand.
            </p>
          </div>
        </div>

        <div className="container about-story">
          <div className="story-copy">
            <h2>Trusted design systems for modern websites</h2>
            <p>
              Since day one, Theme Hub has focused on combining minimal aesthetics with practical utility.
              Our templates are built to look great, load quickly, and be simple to customize.
            </p>
            <ul className="story-list">
              <li>Responsive layouts optimized for desktop and mobile</li>
              <li>Flexible sections that work with your content</li>
              <li>Fast onboarding with ready-made page templates</li>
              <li>Friendly support and regular updates</li>
            </ul>
            <Link to="/contact" className="btn text-white about-cta">
              Talk to our team
            </Link>
          </div>
          <div className="story-card">
            <div className="story-highlight">
              <span>10k+ projects</span>
              <p>Helping customers launch beautiful digital experiences quickly.</p>
            </div>
            <div className="story-stats">
              <div className="stat-item">
                <strong>500+</strong>
                <span>Templates</span>
              </div>
              <div className="stat-item">
                <strong>50k+</strong>
                <span>Happy Users</span>
              </div>
              <div className="stat-item">
                <strong>24/7</strong>
                <span>Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
     </>
  );
}
