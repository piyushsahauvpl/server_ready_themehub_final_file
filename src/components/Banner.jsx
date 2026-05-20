import React from 'react';

export default function Banner({ onPrimary }){
  return (
    <section className="site-banner">
      <div className="container banner-inner">
        <div className="banner-content">
          <h2>High‑quality templates for every project</h2>
          <p>Beautifully crafted UI templates, built with accessibility and performance in mind. Launch faster with ThemeHub.</p>
          <div className="banner-ctas">
            <button className="btn btn-cta" onClick={onPrimary}>Explore Templates</button>
            <a className="btn btn-ghost" href="#learn">Learn More</a>
          </div>
        </div>
        <div className="banner-art" aria-hidden>
          {/* subtle decorative element */}
        </div>
      </div>
    </section>
  )
}
