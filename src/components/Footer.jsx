import React from "react";
import { Link } from "react-router-dom";
import "../assets/css/footer-enhancements.css";
import template2 from "../assets/images/image (1).png";
import template3 from "../assets/images/image (2).png";
import template4 from "../assets/images/image (3).png";
import template5 from "../assets/images/image (4).png";
import template6 from "../assets/images/image (5).png";
import logoImg from "../assets/images/Theme Hub Logo white.png";
import "./Footer.css";

export default function Footer() {
  const templateImages = [template2, template2, template3, template4, template5, template6];

  return (
    <footer className="footer site-footer-redesign">
      <div className="footer-glow footer-glow-one"></div>
      <div className="footer-glow footer-glow-two"></div>

      <div className="container footer-container">
        <div className="footer-top-strip">
          <div>
            <span className="footer-pill">Premium Theme Marketplace</span>
            <h3>Build your next website faster with Uptula Theme Hub.</h3>
          </div>
          <Link to="/templates" className="footer-top-cta">
            Browse Themes <i className="fas fa-arrow-right"></i>
          </Link>
        </div>

        <div className="footer-content">
          <div className="footer-col footer-brand-col">
            <Link to="/" className="footer-logo-link">
              <img src={logoImg} alt="ThemeHub Logo" />
            </Link>
            <p>
              Your trusted marketplace for premium design templates and UI kits.
            </p>

            <div className="social-links">
              {/* <Link to="#" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </Link> */}
              <Link
                to="https://www.facebook.com/profile.php?id=61586691968353"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <i className="fab fa-facebook"></i>
              </Link>
              <Link
                to="https://www.instagram.com/uptulathemehub"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <i className="fab fa-instagram"></i>
              </Link>
              <Link
                to="https://www.linkedin.com/company/uptula-theme-hub/?viewAsMember=true"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Linkedin"
              >
                <i className="fab fa-linkedin"></i>
              </Link>
              {/* <Link to="#" aria-label="GitHub">
                <i className="fab fa-github"></i>
              </Link> */}
            </div>
          </div>

          <div className="footer-col">
            <h4>Marketplace</h4>
            <ul>
              <li><Link to="/templates">All Templates</Link></li>
              <li><Link to="/wordpress">WordPress</Link></li>
              <li><Link to="/react">React</Link></li>
              <li><Link to="/htmlcss">HTML</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              {/* <li><Link to="/">Home</Link></li> */}
              <li><Link to="/templates">Templates</Link></li>
              <li><Link to="/allcategories">Categories</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><Link to="#">Terms of Service</Link></li>
              <li><Link to="#">Privacy Policy</Link></li>
              <li><Link to="#">License</Link></li>
              <li><Link to="#">Refund Policy</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Templates</h4>
            <div className="footer-templates">
              {templateImages.map((image, index) => (
                <Link to="/templates" key={`${image}-${index}`}>
                  <img
                    src={image}
                    alt={`Template ${index + 1}`}
                    className="template-thumb"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2025 ThemeHub. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="#">Terms</Link>
            <Link to="#">Privacy</Link>
            <Link to="#">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
