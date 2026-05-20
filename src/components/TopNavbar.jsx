import React from 'react';
import { FiMail, FiFacebook, FiInstagram, FiLinkedin, FiTwitter } from 'react-icons/fi';
import './TopNavbar.css';
import { Link } from 'react-router-dom';

export default function TopNavbar() {
  return (
    <div className="top-navbar">
      <div className="top-navbar-inner">
        <div className="top-navbar-contact">
          <span className="top-navbar-icon">
            <FiMail />
          </span>
          <a href="mailto:info@themehub.com">
            uptulathemehub@gmail.com
          </a>
        </div>

        <div className="top-navbar-note">
          Premium themes, plugins and templates for modern websites
        </div>

        <div className="top-navbar-social">
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
            aria-label="LinkedIn"
          >
            <FiLinkedin />
          </Link>
          {/* <Link to="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
          >
            <FiTwitter />
          </Link> */}
        </div>
      </div>
    </div>
  );
}
