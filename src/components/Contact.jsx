import React from "react";
import { Link } from "react-router-dom";
import {
  FaPhoneAlt,
  FaClock,
  FaMapMarkerAlt,
  FaEnvelope,
  FaInstagram,
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
} from "react-icons/fa";
import "../pages/Templates.css";
import "./Contact.css";
import contactBannerImage from "../assets/images/contactimg.png";
import { Helmet } from "./SeoHelmet"; 
 
const Contact = () => {
  const fakePhonePrefixPattern = /^1234/;
  const [form, setForm] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = React.useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '');
      
      // Enforce maximum 14 digits
      if (numericValue.length > 14) {
        setStatus('Phone number cannot exceed 14 digits.');
        return;
      }
      
      // Check for fake prefix
      if (fakePhonePrefixPattern.test(numericValue)) {
        setStatus('Phone number cannot start with 1234.');
        return;
      }
      
      // Show warning if less than 6 digits (but still allow typing)
      if (numericValue.length > 0 && numericValue.length < 6) {
        setStatus('Phone number must be at least 6 digits.');
      } else if (numericValue.length >= 6) {
        setStatus(null);
      } else {
        setStatus(null);
      }
      
      setForm({ ...form, phone: numericValue });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    
    // Validate phone number length (6-14 digits)
    if (form.phone && form.phone.length < 6) {
      setStatus('Phone number must be at least 6 digits.');
      return;
    }
    if (form.phone && form.phone.length > 14) {
      setStatus('Phone number cannot exceed 14 digits.');
      return;
    }
    
    if (fakePhonePrefixPattern.test(form.phone)) {
      setStatus('Phone number cannot start with 1234.');
      return;
    }
    
    try {
      const res = await fetch('https://uptulathemehub.com/backend/api/contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setStatus('Message sent successfully!');
        setForm({ firstName: '', lastName: '', email: '', phone: '', message: '' });
        // Redirect after 2 seconds
        setTimeout(() => {
          window.location.href = '/contact';
        }, 2000);
      } else {
        setStatus(data.error || 'Failed to send message.');
      }
    } catch (err) {
      setStatus('Failed to send message.');
    }
  };

  return (
     <>
    <Helmet>
      <title>
        Best WordPress Templates for Small Business | Contact Us
      </title>

      <meta
        name="description"
        content="Reach out to UpTula Theme Hub for the best WordPress templates for small business. We provide fast, friendly & expert support. Contact us anytime today."
      />
    </Helmet>
    <div>
      <section className="templates-banner contact-banner">
        <div className="container banner-content">
          <div className="templates-banner-copy">
            <span className="templates-banner-label">Let's talk</span>
            <h1>Contact Us</h1>
            <p className="lead">Have a question or need support? Our team is ready to help with thoughtful, fast responses.</p>
          </div>
          <div className="contact-banner-visual" aria-hidden="true">
            <img src={contactBannerImage} alt="" />
          </div>
          <div className="templates-banner-card">
            <div className="templates-banner-card-top">
              <span>Need help with your order?</span>
              <strong>Reach us directly</strong>
            </div>
            <div className="templates-banner-card-info">
              <div>
                <p>Email</p>
                <strong>uptulathemehub@gmail.com</strong>
              </div>
              <div>
                <p>Phone</p>
                <strong>7655057392</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="contact-page">
        <div className="contact-container">
          {/* LEFT PANEL */}
          <div className="contact-info">
            <h2>Contact Information</h2>
            <p>Fill up the Form our team will be get back to you</p>
            <div className="info-item">
              <FaPhoneAlt />
              <div>
                <h4>7655057392</h4>
                <span>Free Support!</span>
              </div>
            </div>
            <div className="info-item">
              <FaClock />
              <div>
                <h4>Mon-Sat (10:00 - 19:00)</h4>
                <span>Working Hours</span>
              </div>
            </div>
            <div className="info-item">
              <FaMapMarkerAlt />
              <div>
                <h4>196/2282, Khandagiri Vihar, Bhubaneswar,</h4>
                <span>PIN - 751030</span>
              </div>
            </div>
            <div className="info-item">
              <FaEnvelope />
              <div>
                <h4>uptulathemehub@gmail.com</h4>
                <span>Support us!</span>
              </div>
            </div>
            {/* <div className="social-icons">
              <FaInstagram />
              <FaFacebookF />
              <FaTwitter />
              <FaLinkedinIn />
            </div> */}
          </div>
          {/* RIGHT PANEL */}
          <div className="contact-form">
            <h2>Contact Us</h2>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="input-group">
                  <label>First Name</label>
                  <input type="text" name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <label>Last Name</label>
                  <input type="text" name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} required />
                </div>
              </div>
              <div className="row">
                <div className="input-group">
                  <label>Email</label>
                  <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <label>Phone-Number</label>
                  <input
                    type="tel"
                    name="phone"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Phone-Number"
                    maxLength="14"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="input-group full">
                <textarea name="message" placeholder="Message..." value={form.message} onChange={handleChange} required></textarea>
              </div>
              <button type="submit">Send Message</button>
              {status && <div className="form-status">{status}</div>}
            </form>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
 
export default Contact;
 
 
