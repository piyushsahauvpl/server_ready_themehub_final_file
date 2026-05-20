import React from "react";
import { Link } from "react-router-dom";
import "../assets/css/style.css";

export default function Privacy() {
  return (
    <main className="privacy-page">

      {/* Banner */}
   <section className="page-banner">
        <div className="container">
          <h1>Terms of Service</h1>
          <p className="lead">Have a question or need support? We're here to help.</p>
          <nav className="breadcrumb">
          </nav>
        </div>
      </section>


      {/* Content */}
      <section className="privacy-content">
        <div className="container">
          <div className="privacy-card">

            <div className="policy-item">
              <div>
                <h2>Information We Collect</h2>
                <p>
                  We collect information you provide directly such as
                  account details, purchases, and support requests,
                  along with automatic data like device and usage logs.
                </p>
              </div>
            </div>

            <div className="policy-item">
              <div>
                <h2>How We Use Information</h2>
                <p>
                  Information is used to deliver services, process
                  payments, personalize content, and improve our platform.
                </p>
              </div>
            </div>

            <div className="policy-item">
              <div>
                <h2>Cookies & Tracking</h2>
                <p>
                  Cookies help us remember preferences and analyze traffic.
                  You can disable cookies anytime through your browser.
                </p>
              </div>
            </div>

            <div className="policy-item">
              <div>
                <h2>Data Sharing</h2>
                <p>
                  We never sell your data. Limited data may be shared
                  with trusted partners for hosting and payment processing.
                </p>
              </div>
            </div>

            <div className="policy-item">
              <div>
                <h2>Security</h2>
                <p>
                  Industry-standard safeguards protect your data, but
                  no online service can guarantee 100% security.
                </p>
              </div>
            </div>

            <div className="policy-item">
              <div>
                <h2>Your Rights</h2>
                <p>
                  You may request access, correction, or deletion of
                  your personal data by visiting our{" "}
                  <Link to="/contact">Contact page</Link>.
                </p>
              </div>
            </div>

            <div className="policy-footer">
              <p>Last updated: December 18, 2025</p>
            </div>

          </div>
        </div>
      </section>

    </main>
  );
}
