import React from "react";
import "./WhyChooseUptula.css";
import { Helmet } from "./SeoHelmet"; 

const features = [
  {
    icon: "fa-pen-ruler",
    title: "Easy to Customize",
    text: "Customize everything with live preview and easy options.",
  },
  {
    icon: "fa-table-cells-large",
    title: "Widgets Ready",
    text: "Comes with custom widgets and ready to use elements.",
  },
  {
    icon: "fa-language",
    title: "Translation Ready",
    text: "Fully compatible with WPML & translation plugins.",
  },
  {
    icon: "fa-rotate",
    title: "Regular Updates",
    text: "We update our products regularly for best performance.",
  },
  {
    icon: "fa-cube",
    title: "Cross Browser Compatible",
    text: "Works perfectly on all major browsers.",
  },
  {
    icon: "fa-headset",
    title: "Dedicated Support",
    text: "Get fast and friendly support whenever you need.",
  },
];

// const testimonials = [
//   {
//     quote: "Uptula themes are amazing and easy to customize. Support is super fast and helpful!",
//     name: "John D.",
//     role: "Web Developer",
//     image: "https://i.pravatar.cc/80?img=12",
//   },
//   {
//     quote: "Best WordPress themes I've ever used. Highly recommended for everyone.",
//     name: "Sarah M.",
//     role: "Business Owner",
//     image: "https://i.pravatar.cc/80?img=47",
//   },
//   {
//     quote: "Clean design, clean code and excellent support. Worth every penny!",
//     name: "David R.",
//     role: "Agency Owner",
//     image: "https://i.pravatar.cc/80?img=33",
//   },
// ];

export default function WhyChooseUptula() {
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
    <section className="why-section">
      <div className="why-container">
        <div className="why-top">
          <div className="why-title">
            <span className="why-pill">+ Why Choose UptulaThemeHub</span>
            <h2>
              Everything You Need to <br />
              Build <span>Better Websites</span>
            </h2>
          </div>
        </div>

        <div className="why-feature-grid">
          {features.map((feature) => (
            <article className="why-feature-card" key={feature.title}>
              <span className="why-icon">
                <i className={`fas ${feature.icon}`}></i>
              </span>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            </article>
          ))}
        </div>

        {/* <div className="why-testimonial-panel">
          <button className="why-arrow why-arrow-left" aria-label="Previous testimonial">
            <i className="fas fa-chevron-left"></i>
          </button>

          <div className="why-rating-copy">
            <span className="why-pill">+ What Our Customers Say</span>
            <h2>
              Trusted by Thousands <br />
              of <span>Happy Customers</span>
            </h2>
            <div className="why-rating-row">
              <span className="why-stars" aria-hidden="true">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
              </span>
              <strong>4.9/5 from 2,500+ reviews</strong>
            </div>
          </div>

          <div className="why-testimonial-list">
            {testimonials.map((item) => (
              <article className="why-testimonial-card" key={item.name}>
                <p>"{item.quote}"</p>
                <div className="why-person">
                  <img src={item.image} alt={item.name} />
                  <div>
                    <h3>{item.name}</h3>
                    <span>{item.role}</span>
                    <div className="why-mini-stars" aria-hidden="true">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <button className="why-arrow why-arrow-right" aria-label="Next testimonial">
            <i className="fas fa-chevron-right"></i>
          </button>

          <div className="why-dots" aria-hidden="true">
            <span className="active"></span>
            <span></span>
            <span></span>
          </div>
        </div> */}
      </div>
    </section>
    </>
  );
}
