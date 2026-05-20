import React from "react";
import { Link } from "react-router-dom";
import "../assets/css/style.css";

export default function Terms() {
  return (
    <main className="terms-page">
      {/* Hero Banner */}
    <section className="page-banner">
        <div className="container">
          <h1>Terms of Service</h1>
          <p className="lead">Have a question or need support? We're here to help.</p>
          <nav className="breadcrumb">
          </nav>
        </div>
      </section>

      {/* Content */}
      <section className="terms-content">
        <div className="container">
          <article className="terms-card">
            <div className="term-block">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing or using ThemeHub, you agree to be bound by these
                Terms of Service and all applicable laws and regulations.
              </p>
            </div>

            <div className="term-block">
              <h2>2. Use of the Service</h2>
              <p>
                You may use ThemeHub to browse, preview, and purchase templates.
                You are responsible for ensuring compliance with all applicable
                laws.
              </p>
            </div>

            <div className="term-block">
              <h2>3. Purchases and Payments</h2>
              <p>
                All purchases are subject to our payment terms. Prices,
                availability, and offers may change at any time.
              </p>
            </div>

            <div className="term-block">
              <h2>4. License & Intellectual Property</h2>
              <p>
                All templates and assets are protected by copyright. Purchasing a
                template grants only the license specified on the product page.
              </p>
            </div>

            <div className="term-block">
              <h2>5. Account Responsibility</h2>
              <p>
                You are responsible for maintaining the confidentiality of your
                account and all activities that occur under it.
              </p>
            </div>

            <div className="term-block">
              <h2>6. Limitation of Liability</h2>
              <p>
                ThemeHub shall not be liable for indirect, incidental, or
                consequential damages arising from the use of the platform.
              </p>
            </div>

            <div className="term-block">
              <h2>7. Contact</h2>
              <p>
                If you have any questions regarding these terms, please reach us
                via the <Link to="/contact">Contact page</Link>.
              </p>
            </div>

            <div className="terms-footer">
              <p>Last updated: December 18, 2025</p>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
