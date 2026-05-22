import React, { useEffect, useState, useContext, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getTemplateUrl } from "../lib/slug";
import "../assets/css/style.css";
import "./ItemsSection.css";
import { CartContext } from "../components/CartContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { createCartItem, formatDisplayPrice, getINRPrice } from "../lib/currency";
import productStore from "../lib/productStore";
import { Helmet } from "./SeoHelmet"; 

export default function ItemsSection({ showHeader = true }) {
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const currencyContext = useCurrency();
  const activeCurrency = currencyContext.currency || "INR";
  const [selectedType, setSelectedType] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const [scrollAmount, setScrollAmount] = useState(360);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  useEffect(() => {
    setLoading(true);

    const API_BASE =
      process.env.REACT_APP_API_URL ||
      "https://uptulathemehub.com/backend/api";

    let apiUrl = `${API_BASE}/products.php?currency=${encodeURIComponent(activeCurrency)}`;

    if (selectedType !== "all") {
      apiUrl += `&framework=${encodeURIComponent(selectedType)}`;
    }

    console.log('[ItemsSection] Fetching with URL:', apiUrl);

    fetch(apiUrl, { credentials: "include" })
      .then((res) => res.json())
      .then((resp) => {
        const list = Array.isArray(resp)
          ? resp
          : resp && resp.data
            ? resp.data
            : [];

        console.log('[ItemsSection] API Response:', { 
          listLength: list.length, 
          firstItemCurrency: list[0]?.currency, 
          firstItemSymbol: list[0]?.currency_symbol,
          firstItemPrice: list[0]?.price,
          firstItemConverted: list[0]?.converted_price
        });

        setItems(list);
        setLoading(false);
      })
      .catch((error) => {
        console.error("API Error:", error);
        setItems([]);
        setLoading(false);
      });
  }, [selectedType, activeCurrency]);

  const computeScrollAmount = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    setScrollAmount(container.clientWidth);
  }, []);

  useEffect(() => {
    computeScrollAmount();
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      const canScroll = container.scrollWidth > container.clientWidth + 4;
      setShowLeft(canScroll && container.scrollLeft > 6);
      setShowRight(canScroll && (container.scrollLeft + container.clientWidth) < container.scrollWidth - 6);
    };

    onScroll();
    window.addEventListener('resize', computeScrollAmount);
    container.addEventListener('scroll', onScroll);

    return () => {
      window.removeEventListener('resize', computeScrollAmount);
      container.removeEventListener('scroll', onScroll);
    };
  }, [computeScrollAmount, items.length]);

  const scrollLeft = () =>
    containerRef.current?.scrollBy({ left: -scrollAmount, behavior: 'smooth' });

  const scrollRight = () =>
    containerRef.current?.scrollBy({ left: scrollAmount, behavior: 'smooth' });

  const getPrice = (item) => getINRPrice(item);

  const openTemplate = (item) => {
    productStore.set({ ...item, image: item.image_url });
    navigate(getTemplateUrl(item));
  };

  const getCategoryText = (item) => {
    const text = (
      item.category_name ||
      item.category ||
      item.description ||
      "Business, Corporate"
    )
      .replace(/<[^>]+>/g, "")
      .trim();

    return text.length > 34 ? `${text.slice(0, 34)}...` : text;
  };

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
      className="ra-section"
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="ra-container">
        {showHeader && (
          <motion.div
            className="ra-header ra-latest-style-header"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.46 }}
          >
            <span className="ra-header-pill">+ Browse Our Themes</span>
            <h2>Recently <span>Added</span> Themes</h2>
          </motion.div>
        )}

        <motion.div
          className="ra-categories"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.42, delay: 0.08 }}
        >
          {[
            { icon: "A", label: "All Items", value: "all" },
            { icon: "W", label: "WordPress Themes", value: "WordPress Themes" },
            {
              icon: "</>",
              label: "HTML Website Templates",
              value: "HTML Templates",
            },
            { icon: "L", label: "Landing Page", value: "Next.js Templates" },
            { icon: "R", label: "React Themes", value: "React Templates" },
          ].map((tab, index) => (
            <motion.div
              key={index}
              className={`ra-cat ${selectedType === tab.value ? "active" : ""}`}
              onClick={() => setSelectedType(tab.value)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="ra-cat-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {showLeft && (
          <button className="ra-nav ra-nav-left" onClick={scrollLeft} aria-label="Previous items">
            <i className="fas fa-chevron-left"></i>
          </button>
        )}

        <div className="ra-carousel" ref={containerRef}>
          {loading && <div className="ra-message">Loading templates...</div>}

          {!loading && items.length === 0 && <div className="ra-message">No templates found.</div>}

          {!loading &&
            items.map((item) => (
              <motion.div
                key={item.id}
                className="ra-card"
                onClick={() => openTemplate(item)}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: { opacity: 1, y: 0 },
                }}
                whileHover={{ y: -7 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="ra-thumb">
                  <img
                    src={item.image_url || item.image || "https://via.placeholder.com/420x260?text=Theme+Preview"}
                    alt={item.name || item.title || "Theme preview"}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/420x260?text=Theme+Preview";
                    }}
                  />
                  <div className="ra-image-overlay"></div>
                  <span className="ra-type-pill">
                    {item.framework_name || item.category_name || 'Premium Theme'}
                  </span>
                  <span className="ra-logo-dot">
                    {item.framework_name
                      ? item.framework_name.charAt(0).toUpperCase()
                      : "T"}
                  </span>
                </div>

                <div className="ra-card-body">
                  <h4>{item.name || item.title}</h4>

                  <div className="ra-meta-row">
                    <p>{getCategoryText(item)}</p>
                    <span className="ra-price">{formatDisplayPrice(item, currencyContext)}</span>
                  </div>

                  <div className="ra-bottom">
                    <button
                      className="ra-demo-btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openTemplate(item);
                      }}
                    >
                      Live Demo
                    </button>

                    <button
                      className="ra-cart-btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();

                        addToCart(createCartItem(item));
                      }}
                      aria-label={`Add ${item.name || "template"} to cart`}
                    >
                      <i className="fas fa-shopping-cart" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>

        {showRight && (
          <button className="ra-nav ra-nav-right" onClick={scrollRight} aria-label="Next items">
            <i className="fas fa-chevron-right"></i>
          </button>
        )}

        {!loading && items.length > 4 && (
          <div className="ra-view-all-wrap">
            <motion.button
              className="ra-view-all-btn"
              onClick={() => navigate("/allcategories")}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              View All Themes <i className="fas fa-arrow-right"></i>
            </motion.button>
          </div>
        )}
      </div>
    </motion.section>
    </>
  );
}
