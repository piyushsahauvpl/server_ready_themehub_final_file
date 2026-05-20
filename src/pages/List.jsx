import React, { useState, useEffect, useMemo, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { CartContext } from "../components/CartContext";
import { formatPrice } from "../lib/currency";

function List (){
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const categoryParam = params.get('category') || 'all';
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    setLoading(true);
    fetch('https://uptulathemehub.com/backend/api/products.php')
      .then((res) => res.json())
      .then((json) => {
        const list = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        setTemplates(list);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setTemplates([]);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const cats = templates.flatMap((t) => t.tags || []).filter(Boolean);
    return Array.from(new Set(cats));
  }, [templates]);

  const filteredTemplates = templates.filter((t) => {
    if (categoryParam === 'all') return true;
    const hay = (t.tags || []).join(' ') + ' ' + (t.category || '') + ' ' + (t.title || t.name || '');
    return hay.toLowerCase().includes((categoryParam || '').toLowerCase());
  });

    return(

        <>
        <Nav/>


<div className="browse-layout">
  {/* Sidebar Filters */}
  <aside className="filters-sidebar">
    <div className="filter-header">
      <h3>Filters</h3>
      <button className="clear-filters-btn" id="clearFilters">
        Clear All
      </button>
    </div>
    {/* Category Filter */}
    <div className="filter-group">
      <h4 className="filter-title">
        <i className="fas fa-th-large" />
        Category
      </h4>
      <div className="filter-options" id="categoryFilters">
        <label className="filter-option">
          <input type="checkbox" defaultValue="all" defaultChecked="" />
          <span>All Templates</span>
          <span className="count">12</span>
        </label>
        <label className="filter-option">
          <input type="checkbox" defaultValue="dashboard" />
          <span>Dashboard</span>
          <span className="count">2</span>
        </label>
        <label className="filter-option">
          <input type="checkbox" defaultValue="landing" />
          <span>Landing Page</span>
          <span className="count">1</span>
        </label>
        <label className="filter-option">
          <input type="checkbox" defaultValue="ecommerce" />
          <span>E-Commerce</span>
          <span className="count">1</span>
        </label>
        <label className="filter-option">
          <input type="checkbox" defaultValue="portfolio" />
          <span>Portfolio</span>
          <span className="count">1</span>
        </label>
        <label className="filter-option">
          <input type="checkbox" defaultValue="saas" />
          <span>SaaS</span>
          <span className="count">1</span>
        </label>
        <label className="filter-option">
          <input type="checkbox" defaultValue="corporate" />
          <span>Corporate</span>
          <span className="count">1</span>
        </label>
      </div>
    </div>
    {/* Price Filter */}
    <div className="filter-group">
      <h4 className="filter-title">
        <i className="fas fa-rupee-sign" />
        Price Range
      </h4>
      <div className="price-range">
        <div className="price-inputs">
          <input
            type="number"
            id="minPrice"
            placeholder="Min"
            defaultValue={0}
          />
          <span>-</span>
          <input
            type="number"
            id="maxPrice"
            placeholder="Max"
            defaultValue={100}
          />
        </div>
        <button className="apply-price-btn" id="applyPrice">
          Apply
        </button>
      </div>
    </div>
    {/* Rating Filter */}
    <div className="filter-group">
      <h4 className="filter-title">
        <i className="fas fa-star" />
        Rating
      </h4>
      <div className="filter-options" id="ratingFilters">
        <label className="filter-option">
          <input
            type="radio"
            name="rating"
            defaultValue="all"
            defaultChecked=""
          />
          <span>All Ratings</span>
        </label>
        <label className="filter-option">
          <input type="radio" name="rating" defaultValue={5} />
          <span>
            <i className="fas fa-star rating" />
            <i className="fas fa-star rating" />
            <i className="fas fa-star rating" />
            <i className="fas fa-star rating" />
            <i className="fas fa-star rating" />
          </span>
        </label>
        <label className="filter-option">
          <input type="radio" name="rating" defaultValue={4} />
          <span>
            <i className="fas fa-star rating" />
            <i className="fas fa-star rating" />
            <i className="fas fa-star rating" />
            <i className="fas fa-star rating" />
            <i className="far fa-star rating" />
            &amp; up
          </span>
        </label>
      </div>
    </div>
    {/* Tags Filter */}
    <div className="filter-group">
      <h4 className="filter-title">
        <i className="fas fa-tags" />
        Popular Tags
      </h4>
      <div className="tags-list">
        <button className="tag-chip" data-tag="react">
          React
        </button>
        <button className="tag-chip" data-tag="wordpress">
          WordPress
        </button>
        <button className="tag-chip" data-tag="admin">
          Admin
        </button>
        <button className="tag-chip" data-tag="responsive">
          Responsive
        </button>
        <button className="tag-chip" data-tag="modern">
          Modern
        </button>
        <button className="tag-chip" data-tag="saas">
          SaaS
        </button>
        <button className="tag-chip" data-tag="ecommerce">
          E-commerce
        </button>
        <button className="tag-chip" data-tag="dashboard">
          Dashboard
        </button>
      </div>
    </div>
  </aside>
  {/* Main Content */}
  <div className="templates-content">
    {/* Toolbar */}
    <div className="templates-toolbar">
      <div className="toolbar-left">
        <p className="results-count">
          Showing <span id="resultsCount">12</span> templates
        </p>
      </div>
      <div className="toolbar-right">
        <div className="view-toggle">
          <button className="view-btn" data-view="grid">
            <i className="fas fa-th" />
          </button>
          <button className="view-btn active" data-view="list">
            <i className="fas fa-list" />
          </button>
        </div>
        <select className="sort-select" id="sortSelect">
          <option value="popular">Most Popular</option>
          <option value="newest">Newest First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
          <option value="sales">Best Selling</option>
        </select>
      </div>
    </div>
    {/* Templates Grid */}
    <div className="templates-grid list-view" id="templatesGrid">
      {loading ? (
        <p>Loading templates...</p>
      ) : filteredTemplates.length === 0 ? (
        <p>No templates found</p>
      ) : (
        filteredTemplates.map((template) => (
          <div className="template-card" key={template.id} data-id={template.id}>
            <div className="template-image">
              <img src={template.image} alt={template.title || template.name} />
              <span className="template-badge">{template.is_featured ? 'Featured' : (template.tags?.[0] || '')}</span>
              <div className="template-actions">
                <button className="action-btn preview-btn" title="Quick View" onClick={() => window.open(template.preview_url || '#', '_blank', 'noopener,noreferrer')}>
                  <i className="fas fa-eye" />
                </button>
                <button className="action-btn wishlist-btn" title="Add to Wishlist">
                  <i className="fas fa-heart" />
                </button>
              </div>
            </div>

            <div className="template-info">
              <div className="template-header">
                <div>
                  <h3 className="template-title">{template.title || template.name}</h3>
                  <p className="template-author">by {template.author || 'ThemeHub'}</p>
                </div>
                <div className="template-price">{formatPrice(template.price)}</div>
              </div>

              <p className="template-description">{template.description}</p>

              <div className="template-meta">
                <div className="meta-item rating">
                  <i className="fas fa-star" />
                  <span>{template.rating || 0}</span>
                </div>
                <div className="meta-item">
                  <i className="fas fa-download" />
                  <span>{template.downloads || 0}</span>
                </div>

                <button
                  className="btn-primary add-to-cart-btn"
                  style={{
                    marginLeft: "auto",
                    padding: "0.5rem 1rem",
                    fontSize: "0.85rem",
                  }}
                  onClick={() => addToCart({ id: template.id, title: template.title || template.name, price: Number(template.offer_price ?? template.price ?? 0), image: template.image })}
                >
                  <i className="fas fa-shopping-cart" /> Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
    {/* Pagination */}
    <div className="pagination" id="pagination">
      <button className="page-btn" id="prevPage" disabled>
        <i className="fas fa-chevron-left" />
        Previous
      </button>
      <div className="page-numbers" id="pageNumbers">
        <button className="page-number active">1</button>
        <button className="page-number">2</button>
      </div>
      <button className="page-btn" id="nextPage">
        Next
        <i className="fas fa-chevron-right" />
      </button>
    </div>
  </div>
</div>



          </div>


        </div>
      </div>







      <div className="template-card" data-id={9}>
        <div className="template-image">
          <img
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop"
            alt="Medical & Health"
          />
          <span className="template-badge">New</span>
          <div className="template-actions">
            <button
              className="action-btn preview-btn"
              data-id={9}
              title="Quick View"
            >
              <i className="fas fa-eye" />
            </button>
            <button
              className="action-btn wishlist-btn "
              data-id={9}
              title="Add to Wishlist"
            >
              <i className="fas fa-heart" />
            </button>
          </div>
        </div>
        <div className="template-info">
            <div className="template-header">
            <div>
              <h3 className="template-title">Medical &amp; Health</h3>
              <p className="template-author">by HealthTemplates</p>
            </div>
            <div className="template-price">₹55</div>
          </div>
          <p className="template-description">
            Professional medical website with appointment booking, doctor
            profiles, and services.
          </p>
          <div className="template-meta">
            <div className="meta-item rating">
              <i className="fas fa-star" />
              <span>4.7</span>
            </div>
            <div className="meta-item">
              <i className="fas fa-download" />
              <span>1098</span>
            </div>
            <button
              className="btn-primary add-to-cart-btn"
              data-id={9}
              style={{
                marginLeft: "auto",
                padding: "0.5rem 1rem",
                fontSize: "0.85rem"
              }}
            >
              <i className="fas fa-shopping-cart" /> Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
    {/* Pagination */}
    <div className="pagination" id="pagination">
      <button className="page-btn" id="prevPage" disabled="">
        <i className="fas fa-chevron-left" />
        Previous
      </button>
      <div className="page-numbers" id="pageNumbers">
        <button className="page-number active">1</button>
        <button className="page-number ">2</button>
      </div>
      <button className="page-btn" id="nextPage">
        Next
        <i className="fas fa-chevron-right" />
      </button>
    </div>
  </div>
</div>







        <Footer/>
        </>
    )
}
export default List;
