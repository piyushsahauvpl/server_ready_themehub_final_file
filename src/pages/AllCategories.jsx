import React, { useState, useEffect, useContext, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'
import { CartContext } from '../components/CartContext'
import productStore from '../lib/productStore'
import { getTemplateUrl } from '../lib/slug'
import '../assets/css/templates-scroll.css'
import '../assets/css/themehub-ui.css'
import categoriesBannerImage from '../assets/images/categoriesimg.png'
import { Helmet } from '../components/SeoHelmet'

const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

export default function AllCategoriesPage(){
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useContext(CartContext);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [scrollOnCategoryClick, setScrollOnCategoryClick] = useState(false);
  const templatesPerPage = 8;
  const containerRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catParam = params.get('cat');
    if (catParam) setSelectedCategory(catParam.toLowerCase());
  }, [location.search]);

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const res = await fetch(`${API_URL}/categories.php`);
        const data = await res.json();
        if (data.success) setCategories(data.categories);
      } catch (err) {
        console.error(err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/products.php`);
        const data = await res.json();
        let filtered = data.data || [];

        if (selectedCategory !== 'all') {
          filtered = filtered.filter(p => {
            const name = (p.category_name || '').toLowerCase();
            const slug = (p.category_slug || '').toLowerCase();
            return name.includes(selectedCategory) || slug.includes(selectedCategory);
          });
        }

        setProducts(filtered);
        setCurrentPage(1);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory]);

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    setScrollOnCategoryClick(true);
    navigate(cat === 'all' ? '/allcategories' : `/allcategories?cat=${cat}`, { replace: true });
  };

  useEffect(() => {
    if (!scrollOnCategoryClick) return;
    if (loading) return;
    if (!containerRef.current) return;

    const headerOffset = 110;
    const top = containerRef.current.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    setScrollOnCategoryClick(false);
  }, [scrollOnCategoryClick, loading]);

  const searchedProducts = products.filter((item) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;

    return [
      item.name,
      item.title,
      item.category_name,
      item.framework_name,
      item.description
    ].some((value) => String(value || '').toLowerCase().includes(query));
  });

  const totalPages = Math.max(1, Math.ceil(searchedProducts.length / templatesPerPage));
  const start = (currentPage - 1) * templatesPerPage;
  const paginated = searchedProducts.slice(start, start + templatesPerPage);

  return (

     <>
    <Helmet>
      <title>
        Affordable WordPress Themes for Startups | All Categories
      </title>

      <meta
        name="description"
        content="Discover affordable WordPress themes for startups at UpTula Theme Hub. Browse all categories for premium, responsive & budget-friendly designs. Explore now."
      />
    </Helmet>
    <main className="bg-gray-50 min-h-screen">

      {/* 🔥 NEW PREMIUM HERO (MATCH IMAGE) */}
      <section className="hero-section hero-banner">
        <style>{`
          .hero-banner {
            background: #f4f9f5;
            padding: 34px 0 38px;
            min-height: 260px;
            position: relative;
            overflow: hidden;
          }

          .hero-banner-grid {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1.1fr 1fr;
            align-items: center;
            gap: 40px;
            min-height: 215px;
            padding: 0 18px;
          }

          .hero-banner-content {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: center;
            gap: 12px;
            position: relative;
            z-index: 1;
          }

          .hero-banner-badge {
            border: 1px solid #1a6b3a;
            color: #1a6b3a;
            padding: 6px 14px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
          }

          .hero-banner-title {
            font-size: 52px;
            font-weight: 800;
            margin: 20px 0 0;
            line-height: 1.1;
            color: #111;
          }

          .hero-banner-desc {
            color: #555;
            font-size: 15px;
            margin: 0;
            max-width: 560px;
            line-height: 1.65;
          }

          .hero-banner-button {
            margin-top: 20px;
            background: #28a745;
            color: #fff;
            padding: 12px 26px;
            border-radius: 8px;
            border: none;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease, background 0.2s ease;
            position: relative;
            z-index: 1;
          }

          .hero-banner-button:hover {
            background: #1f7e32;
            transform: translateY(-1px);
          }

          .hero-banner-trusted {
            margin-top: 20px;
            font-size: 14px;
            color: #444;
            position: relative;
            z-index: 1;
          }

          .hero-banner-image {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 360px;
            width: 100%;
            position: relative;
            order: 2;
            z-index: 1;
          }

          .hero-banner-image img {
            width: 100%;
            max-width: 540px;
            height: auto;
            object-fit: contain;
            filter: drop-shadow(0 20px 40px rgba(0,0,0,0.12));
          }

          .hero-banner::before {
            content: "";
            position: absolute;
            width: 420px;
            height: 420px;
            background: radial-gradient(circle, rgba(40,167,69,0.18) 0%, transparent 65%);
            top: -80px;
            right: -80px;
            border-radius: 50%;
            z-index: 0;
            pointer-events: none;
          }

          .hero-banner::after {
            content: "";
            position: absolute;
            width: 260px;
            height: 260px;
            background: radial-gradient(circle, rgba(40,167,69,0.10) 0%, transparent 70%);
            bottom: -40px;
            left: -20px;
            border-radius: 50%;
            z-index: 0;
            pointer-events: none;
          }

          @media (max-width: 960px) {
            .hero-banner-grid {
              grid-template-columns: 1fr;
              text-align: center;
            }

            .hero-banner-content {
              align-items: center;
            }

            .hero-banner-image {
              order: 2;
              min-height: 260px;
            }

            .hero-banner-title {
              font-size: 42px;
            }

            .hero-banner-desc {
              max-width: 100%;
            }
          }

          @media (max-width: 720px) {
            .hero-banner-grid {
              gap: 28px;
            }

            .hero-banner-title {
              font-size: 34px;
            }

            .hero-banner-button {
              width: 100%;
              max-width: 280px;
            }

            .hero-banner-image img {
              max-width: 100%;
            }
          }

          @media (max-width: 520px) {
            .hero-banner {
              padding: 28px 0 30px;
            }

            .hero-banner-title {
              font-size: 30px;
            }

            .hero-banner-desc {
              font-size: 14px;
            }

            .hero-banner-button {
              padding: 12px 20px;
            }
          }
        `}</style>

        <div className="hero-banner-grid">

          {/* LEFT */}
          <div className="hero-banner-content">
            <span className="hero-banner-badge">
              TEMPLATES MARKETPLACE
            </span>

            <h1 className="hero-banner-title">
              Discover Premium<br />
              Templates<br />
              for Every Project
            </h1>

            <p className="hero-banner-desc">
              Browse 500+ professionally designed templates for WordPress,
              React, HTML & more.
            </p>

            <button
              onClick={() =>
                document.querySelector(".th-container")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="hero-banner-button"
            >
              Browse All →
            </button>

            <div className="hero-banner-trusted">
              ⭐⭐⭐⭐⭐ Trusted by <strong>15,000+</strong> customers
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="hero-banner-image">
            <img
              src={categoriesBannerImage}
              alt="Categories showcase"
            />
          </div>

        </div>
      </section>

      {/* ================= PRODUCTS SECTION ================= */}
      <section className="th-container" ref={containerRef}>

        {/* CATEGORY TABS */}
        <div className="th-tabs">
          <div
            className={`th-tab ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => handleCategoryClick('all')}
          >
            All Items
          </div>

          {!categoriesLoading && categories.map(cat => {
            const value = (cat.slug || cat.name).toLowerCase();
            return (
              <div
                key={cat.id}
                className={`th-tab ${selectedCategory === value ? 'active' : ''}`}
                onClick={() => handleCategoryClick(value)}
              >
                {cat.name}
              </div>
            );
          })}
        </div>

        {/* GRID */}
        <div className="th-grid" ref={gridRef}>
          {loading && <p className="th-center">Loading templates...</p>}

          {!loading && paginated.map((item, i) => (
            <div
              key={item.id}
              className="th-card"
              style={{ animationDelay: `${i * 0.05}s` }}
              onClick={() => {
                productStore.set({ ...item, image: item.image_url });
                navigate(getTemplateUrl(item));
              }}
            >
              <div className="th-img">
                <img src={item.image_url} alt={item.name} />
                <div className="th-overlay">
                  <button>Preview</button>
                </div>
                <span className="th-price">₹{item.price}</span>
              </div>

              <div className="th-body">
                <h4>{item.name}</h4>
                <p>{item.category_name}</p>

                <div className="th-bottom">
                  <span>★ 4.5</span>

                  <button
                    className="th-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(item);
                      e.target.innerText = "✓ Added!";
                      setTimeout(()=> e.target.innerText="Add to Cart",1500);
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* PAGINATION */}
        {!loading && searchedProducts.length > templatesPerPage && (
          <div className="th-pagination">
            <button onClick={()=>setCurrentPage(p=>Math.max(p-1,1))}>Prev</button>
            <span>Page {currentPage} / {totalPages}</span>
            <button onClick={()=>setCurrentPage(p=>Math.min(p+1,totalPages))}>Next</button>
          </div>
        )}

      </section>
    </main>
    </>
  );
}
