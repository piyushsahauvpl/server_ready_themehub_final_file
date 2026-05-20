import React, { useEffect, useContext, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import productStore from "../lib/productStore";
import { CartContext } from "../components/CartContext";
import { getTemplateUrl } from "../lib/slug";
import "./Templates.css";
import { Helmet } from "../components/SeoHelmet"; 

// Color tokens (matches design): primary #1a6b3a, accent #00c853,
// mint bg #f4f9f5, mint tag #e8f5e9, dark cta #0d2b1a, text #1a1a1a / #555555

const SORT_OPTIONS = new Set(["popular", "newest", "price-low", "price-high", "rating"]);
const VIEW_OPTIONS = new Set(["grid", "list"]);

function normalizeValue(value) {
  return String(value || "").trim().toLowerCase();
}

function parseNumericParam(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseTemplateTags(value) {
  if (Array.isArray(value)) {
    return value
      .map((tag) => String(tag || "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function isTemplateMarkedNew(template) {
  const badge = normalizeValue(template.badge);
  const tags = parseTemplateTags(template.tags).map(normalizeValue);
  return (
    Number(template.is_latest || 0) === 1 ||
    badge === "new" ||
    badge === "latest" ||
    tags.includes("new") ||
    tags.includes("latest")
  );
}

function Templates({ embed = false, initialCategory = null }) {
  const { addToCart } = useContext(CartContext);

  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const API_URL =
      process.env.REACT_APP_API_URL ||
      "https://uptulathemehub.com/backend/api";
    const API = `${API_URL}/products.php`;
    setLoadingTemplates(true);
    fetch(API, { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        if (json && json.success && Array.isArray(json.data)) {
          setTemplates(json.data);
          setFetchError(null);
        } else {
          setTemplates([]);
          setFetchError("Invalid response");
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setFetchError(err.message || "Fetch error");
        setTemplates([]);
      })
      .finally(() => mounted && setLoadingTemplates(false));
    return () => { mounted = false; };
  }, []);

  const navigate = useNavigate();
  useEffect(() => {
    window.__navigate__ = navigate;
    return () => { delete window.__navigate__; };
  }, [navigate]);

  useEffect(() => {
    if (embed && initialCategory) setSelectedCategories([initialCategory]);
  }, [embed, initialCategory]);

  const [view, setView] = useState("grid");
  const [selectedCategories, setSelectedCategories] = useState(["all"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [backendCategories, setBackendCategories] = useState([]);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const location = useLocation();
  const [filtersReady, setFiltersReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const API_URL =
      process.env.REACT_APP_API_URL ||
      "https://uptulathemehub.com/backend/api";
    fetch(`${API_URL}/categories.php`, { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        if (json && json.success && Array.isArray(json.categories)) setBackendCategories(json.categories);
        else setBackendCategories([]);
      })
      .catch(() => mounted && setBackendCategories([]));
    return () => { mounted = false; };
  }, []);

  const [minPriceInput, setMinPriceInput] = useState(0);
  const [maxPriceInput, setMaxPriceInput] = useState(0);
  const [appliedMin, setAppliedMin] = useState(0);
  const [appliedMax, setAppliedMax] = useState(0);
  const [initialMin, setInitialMin] = useState(0);
  const [initialMax, setInitialMax] = useState(0);
  const [selectedRating, setSelectedRating] = useState("all");
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState("popular");

  const [newMarked, setNewMarked] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("newTemplates") || "[]")); }
    catch { return new Set(); }
  });
  const [showOnlyNew, setShowOnlyNew] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = view === "grid" ? 9 : 6;

  useEffect(() => {
    if (loadingTemplates) return;

    const vals = templates.map((t) => Number(t.price || 0)).filter((value) => Number.isFinite(value));
    const min = vals.length ? Math.min(...vals) : 0;
    const max = vals.length ? Math.max(...vals) : 0;

    setInitialMin(min);
    setInitialMax(max);

    const params = new URLSearchParams(location.search);
    const q = (params.get("q") || "").trim();
    const categoriesParam = params.get("categories");
    const categoryParam = params.get("category");
    const rawCategories = categoriesParam
      ? categoriesParam.split(",").map((item) => normalizeValue(decodeURIComponent(item))).filter(Boolean)
      : categoryParam
        ? [normalizeValue(decodeURIComponent(categoryParam))]
        : [];
    const nextCategories = rawCategories.length === 0 || rawCategories.includes("all")
      ? ["all"]
      : Array.from(new Set(rawCategories));
    const nextMin = parseNumericParam(params.get("minPrice"), min);
    const nextMax = parseNumericParam(params.get("maxPrice"), max);
    const ratingParam = params.get("rating");
    const nextRating = ratingParam === "4" ? "4" : "all";
    const nextTags = Array.from(new Set(
      (params.get("tags") || "")
        .split(",")
        .map((item) => normalizeValue(decodeURIComponent(item)))
        .filter(Boolean),
    ));
    const sortParam = params.get("sort");
    const viewParam = params.get("view");

    setSearchQuery(q);
    setAppliedSearch(q);
    setSelectedCategories(nextCategories);
    setMinPriceInput(nextMin);
    setMaxPriceInput(nextMax);
    setAppliedMin(nextMin);
    setAppliedMax(nextMax);
    setSelectedRating(nextRating);
    setSelectedTags(nextTags);
    setSortBy(SORT_OPTIONS.has(sortParam) ? sortParam : "popular");
    setView(VIEW_OPTIONS.has(viewParam) ? viewParam : "grid");
    setShowOnlyNew(params.get("new") === "1");
    setCurrentPage(1);
    setFiltersReady(true);
  }, [loadingTemplates, location.search, templates]);

  useEffect(() => { setCurrentPage(1); }, [
    appliedSearch, appliedMin, appliedMax, selectedCategories,
    selectedRating, selectedTags, sortBy, view,
  ]);

  useEffect(() => {
    if (!filtersReady || embed) return;

    const params = new URLSearchParams();

    if (appliedSearch) params.set("q", appliedSearch);

    if (selectedCategories.length === 1 && selectedCategories[0] !== "all") {
      params.set("category", selectedCategories[0]);
    } else if (selectedCategories.length > 1 && !selectedCategories.includes("all")) {
      params.set("categories", selectedCategories.join(","));
    }

    if (appliedMin !== initialMin) params.set("minPrice", String(appliedMin));
    if (appliedMax !== initialMax) params.set("maxPrice", String(appliedMax));
    if (selectedRating !== "all") params.set("rating", selectedRating);
    if (selectedTags.length) params.set("tags", selectedTags.join(","));
    if (showOnlyNew) params.set("new", "1");
    if (sortBy !== "popular") params.set("sort", sortBy);
    if (view !== "grid") params.set("view", view);

    const nextSearch = params.toString();
    const currentSearch = location.search.replace(/^\?/, "");
    if (nextSearch !== currentSearch) {
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : "",
        },
        { replace: true },
      );
    }
  }, [
    appliedMax,
    appliedMin,
    appliedSearch,
    embed,
    filtersReady,
    initialMax,
    initialMin,
    location.pathname,
    location.search,
    navigate,
    selectedCategories,
    selectedRating,
    selectedTags,
    showOnlyNew,
    sortBy,
    view,
  ]);

  const categoryCounts = templates.reduce((acc, t) => {
    const key = t.category_name || t.category || t.framework_name || "uncategorized";
    const k = String(key).toLowerCase();
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const availableTags = Array.from(
    new Set(
      templates
        .flatMap((t) => parseTemplateTags(t.tags))
        .map((tag) => normalizeValue(tag))
        .filter(Boolean),
    ),
  );

  function toggleCategory(value) {
    if (value === "all") { setSelectedCategories(["all"]); return; }
    setSelectedCategories((prev) => {
      const set = new Set(prev.filter((v) => v !== "all"));
      if (set.has(value)) set.delete(value); else set.add(value);
      const arr = Array.from(set);
      return arr.length === 0 ? ["all"] : arr;
    });
  }

  function applyPriceRange() {
    let a = Number(minPriceInput) || 0;
    let b = Number(maxPriceInput) || 0;
    if (a > b) [a, b] = [b, a];
    setAppliedMin(a); setAppliedMax(b);
  }

  function toggleTag(tag) {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  const filteredTemplates = templates.filter((t) => {
    const q = (appliedSearch || "").trim().toLowerCase();
    const priceVal = Number(t.price || 0);
    const templateTags = parseTemplateTags(t.tags).map(normalizeValue);
    const ratingValue = Number(t.rating ?? 0);
    const byCategory = selectedCategories.includes("all") ||
      selectedCategories.some((sel) => {
        const s = normalizeValue(sel);
        const cat = normalizeValue(t.category_name || t.category);
        const framework = normalizeValue(t.framework_name);
        return (cat && cat.includes(s)) || (framework && framework.includes(s)) || templateTags.some((tag) => tag.includes(s));
      });
    const byPrice =
      (typeof appliedMin === "number" && appliedMin > 0 ? priceVal >= appliedMin : true) &&
      (typeof appliedMax === "number" && appliedMax > 0 ? priceVal <= appliedMax : true);
    const byRating = selectedRating === "all" ? true : ratingValue >= Number(selectedRating);
    const byTags = selectedTags.length === 0 ? true
      : selectedTags.some((tag) => templateTags.includes(tag));
    const title = normalizeValue(t.title || t.name);
    const description = normalizeValue(t.description);
    const sellerName = normalizeValue(t.seller_name || t.author);
    const categoryName = normalizeValue(t.category_name || t.category);
    const frameworkName = normalizeValue(t.framework_name);
    const bySearch = !q ||
      title.includes(q) ||
      description.includes(q) ||
      sellerName.includes(q) ||
      categoryName.includes(q) ||
      frameworkName.includes(q) ||
      templateTags.some((tag) => tag.includes(q));
    const isMarkedNew = newMarked.has(t.id) || isTemplateMarkedNew(t);
    if (showOnlyNew && !isMarkedNew) return false;
    return byCategory && byPrice && byRating && byTags && bySearch;
  });

  const sortedTemplates = filteredTemplates.slice();
  if (sortBy === "popular") sortedTemplates.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
  else if (sortBy === "newest") sortedTemplates.sort((a, b) => (b.id || 0) - (a.id || 0));
  else if (sortBy === "price-low") sortedTemplates.sort((a, b) => (a.price || 0) - (b.price || 0));
  else if (sortBy === "price-high") sortedTemplates.sort((a, b) => (b.price || 0) - (a.price || 0));
  else if (sortBy === "rating") sortedTemplates.sort((a, b) => (b.rating || 0) - (a.rating || 0));

  const totalPages = Math.max(1, Math.ceil(sortedTemplates.length / perPage));
  const pagedTemplates = sortedTemplates.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getPageWindow = () => {
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);
    if (end - start < 4) { start = Math.max(1, end - 4); end = Math.min(totalPages, start + 4); }
    const pages = []; for (let i = start; i <= end; i++) pages.push(i);
    return { pages, start, end };
  };
  const { pages: pageNumbers, start: pageWindowStart, end: pageWindowEnd } = getPageWindow();

  const goToPage = (p) => setCurrentPage(Math.max(1, Math.min(totalPages, p)));
  const prevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const nextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  const totalResults = sortedTemplates.length;
  const startResult = totalResults === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endResult = Math.min(currentPage * perPage, totalResults);

  // ───────────────────────── shared styles ─────────────────────────
  const PRIMARY = "#1a6b3a";
  const ACCENT = "#00c853";
  const MINT_BG = "#f4f9f5";
  const MINT_TAG = "#e8f5e9";
  const DARK_CTA = "#0d2b1a";
  const TEXT = "#1a1a1a";
  const MUTED = "#555555";

  const Stars = ({ rating = 5 }) => (
    <span style={{ color: "#f5b301", fontSize: 13, letterSpacing: 1 }}>
      {"★".repeat(Math.round(rating))}<span style={{ color: "#e5e7eb" }}>{"★".repeat(5 - Math.round(rating))}</span>
    </span>
  );

  const templateThemes = [
    { card: "#f4fbf5", bg: "#e7f2e7", accent: "#1a6b3a", btn: "#1a6b3a", price: "#0d2b1a", border: "#dce7dd", text: TEXT },
    { card: "#f2f7ff", bg: "#e8efff", accent: "#1d4daf", btn: "#1d4daf", price: "#0f3474", border: "#d5e0f6", text: TEXT },
    { card: "#fff7f1", bg: "#fff0e5", accent: "#c24f1d", btn: "#c24f1d", price: "#7a3216", border: "#f1d8cc", text: TEXT },
    { card: "#f7f4ff", bg: "#ece8ff", accent: "#5c3ab3", btn: "#5c3ab3", price: "#36236b", border: "#dfdaf3", text: TEXT },
    { card: "#f7fff5", bg: "#e8ffe4", accent: "#389d5b", btn: "#389d5b", price: "#1c6438", border: "#d8e7d8", text: TEXT },
  ];

  const getTemplateTheme = (item) => {
    const key = String(item.id ?? item.title ?? item.name ?? item.category ?? "0");
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
      hash = (hash * 31 + key.charCodeAt(i)) % templateThemes.length;
    }
    return templateThemes[hash];
  };

  const TemplateCard = (t) => {
    const theme = getTemplateTheme(t);
    const isMarkedNew = newMarked.has(t.id) || isTemplateMarkedNew(t);
    const cat = t.category_name || t.framework_name || t.category || "Template";
    const imageSource = t.image || t.image_url || "/images/main.png";
    const hasImage = Boolean(t.image || t.image_url);
    return (
      <article key={t.id} className="product-card group" data-id={t.id}
        style={{
          width: "100%", minWidth: 0, maxWidth: "100%", background: theme.card, borderRadius: 22, overflow: "hidden",
          boxShadow: "0 10px 28px rgba(13,43,26,.08)", border: `1px solid ${theme.border}`,
          transition: "transform .2s ease, box-shadow .2s ease", display: "flex", flexDirection: "column",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 16px 36px rgba(13,43,26,.16)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(13,43,26,.08)"; }}
      >
        <div className="product-media" style={{ position: "relative", height: 220, overflow: "hidden", background: theme.bg }}>
          <Link to={getTemplateUrl(t)} onClick={() => productStore.set(t)} aria-label={`Open ${t.title || t.name}`}>
            {hasImage ? (
              <img
                src={imageSource}
                alt={t.title || t.name}
                onError={(e) => { e.target.src = "/cs-assets/assets/img/placeholder.png"; }}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: theme.accent, fontSize: 18, fontWeight: 700, background: `linear-gradient(135deg, ${theme.accent}1a, ${theme.bg})` }}>
                {cat}
              </div>
            )}
          </Link>
          {(t.downloads || 0) > 2000 && (
            <span style={{ position: "absolute", top: 14, left: 14, background: "#ffd54a", color: TEXT, fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: "5px 11px", borderRadius: 999 }}>BEST SELLER</span>
          )}
          {isMarkedNew && (
            <span style={{ position: "absolute", top: 14, left: 14, background: theme.accent, color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: "5px 11px", borderRadius: 999 }}>NEW</span>
          )}
          <span className="product-price" style={{ position: "absolute", top: 14, right: 14, background: theme.price, color: "#fff", fontWeight: 700, fontSize: 12, padding: "6px 14px", borderRadius: 999, boxShadow: "0 8px 22px rgba(0,0,0,.12)" }}>
            ₹{t.price_display ?? Number(t.price || 0).toFixed(2)}
          </span>
        </div>

        <div className="product-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 className="product-title" style={{ fontSize: 15, fontWeight: 700, color: TEXT, margin: 0, lineHeight: 1.4 }}>
                {t.title || t.name}
              </h3>
              <div className="product-author" style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
                by {t.seller_name || t.author || "Admin"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ background: theme.bg, color: theme.accent, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 4, textTransform: "capitalize", whiteSpace: "nowrap" }}>
              {cat}
            </span>
            <div className="product-rating meta-item rating" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <Stars rating={Number(t.rating ?? 0)} />
            </div>
          </div>

          <button
            type="button"
            className="add-to-cart-btn"
            onClick={() => addToCart({ id: t.id, title: t.title || t.name, price: Number(t.price || 0), image: t.image || t.image_url })}
            style={{
              width: "100%", background: theme.btn, color: "#fff", border: `1px solid ${theme.btn}`,
              padding: "12px 16px", borderRadius: 8, fontWeight: 600, fontSize: 13,
              cursor: "pointer", transition: "all .2s", marginTop: "auto",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            🛒 Add to Cart
          </button>
        </div>
      </article>
    );
  };

  const ListRow = (t) => {
    const theme = getTemplateTheme(t);
    const isMarkedNew = newMarked.has(t.id) || isTemplateMarkedNew(t);
    const cat = t.category_name || t.framework_name || t.category || "Template";
    return (
      <div key={t.id} className="template-card" data-id={t.id}
        style={{ display: "flex", gap: 20, background: theme.card, borderRadius: 20, padding: 18, border: `1px solid ${theme.border}`, boxShadow: "0 10px 28px rgba(13,43,26,.07)" }}>
        <div className="template-image" style={{ flex: "0 0 280px", height: 200, position: "relative", borderRadius: 16, overflow: "hidden", background: theme.bg }}>
          <Link to={getTemplateUrl(t)} onClick={() => productStore.set(t)}>
            <img src={t.image || t.image_url || "/cs-assets/assets/img/placeholder.png"}
              alt={t.title || t.name}
              onError={(e) => { e.target.src = "/cs-assets/assets/img/placeholder.png"; }}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </Link>
          {(t.downloads || 0) > 2000 && (
            <span className="template-badge" style={{ position: "absolute", top: 14, left: 14, background: "#ffd54a", color: TEXT, fontSize: 10, fontWeight: 700, padding: "5px 11px", borderRadius: 999 }}>BEST SELLER</span>
          )}
          {isMarkedNew && (
            <span className="template-badge new" style={{ position: "absolute", top: 14, left: 14, background: theme.accent, color: "#fff", fontSize: 10, fontWeight: 700, padding: "5px 11px", borderRadius: 999 }}>NEW</span>
          )}
        </div>
        <div className="template-info" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="template-header" style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
            <div>
              <h3 className="template-title" style={{ fontSize: 20, fontWeight: 800, color: theme.text, margin: 0 }}>{t.title || t.name}</h3>
              <p className="template-author" style={{ fontSize: 13, color: MUTED, margin: "6px 0 0" }}>by {t.seller_name || t.author || "Admin"}</p>
            </div>
            <div className="template-price" style={{ background: theme.price, color: "#fff", padding: "8px 16px", borderRadius: 999, fontWeight: 700, height: "fit-content" }}>
              ₹{t.price_display ?? Number(t.price || 0).toFixed(2)}
            </div>
          </div>
          <p className="template-description" style={{ color: MUTED, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{t.description || "Premium template"}</p>
          <div className="template-meta" style={{ display: "flex", alignItems: "center", gap: 16, marginTop: "auto", flexWrap: "wrap" }}>
            <div className="meta-item rating" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Stars rating={Number(t.rating ?? 0)} /></div>
            <div className="meta-item downloads" style={{ fontSize: 12, color: MUTED }}>{t.downloads || 0} downloads</div>
            <button type="button" className="btn add-to-cart-btn"
              onClick={() => addToCart({ id: t.id, title: t.title || t.name, price: Number(t.price || 0), image: t.image || t.image_url })}
              style={{ marginLeft: "auto", background: theme.btn, color: "#fff", border: `1px solid ${theme.btn}`, padding: "10px 20px", borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    );
  };

  const listContent = (() => {
    if (loadingTemplates) return <div className="templates-loading" style={{ padding: 60, textAlign: "center", color: MUTED }}>Loading templates…</div>;
    if (fetchError) return <div className="templates-error" style={{ padding: 40, textAlign: "center", color: "#c0392b" }}>Failed to load templates: {fetchError}</div>;
    if (view === "grid") {
      return (
        <div className="product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 24, justifyContent: "start" }}>
          {pagedTemplates.map(TemplateCard)}
        </div>
      );
    }
    return (
      <div className="templates-grid list-view" id="templatesGrid" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {pagedTemplates.map(ListRow)}
      </div>
    );
  })();

  // shared filter input/btn styles
  const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid #d8e3da", borderRadius: 8, fontSize: 14, outline: "none", background: "#fff" };

  return (

    <>
  <Helmet>
    <title>
      Best Modern WordPress Themes | Templates Uptula Theme Hub
    </title>

    <meta
      name="description"
      content="Find the best modern WordPress themes & templates at UpTula. Professionally designed, fast & responsive themes for every website. Start building today."
    />
  </Helmet>

    <div className="templates-page">
      {/* BROWSE */}
      <section className="templates-browse-section" style={{ padding: "48px 0", background: "#fff" }}>
        <div className="container mx-auto px-4">
          <div className="browse-layout" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 32, alignItems: "start" }}>

            {/* SIDEBAR */}
            <aside className="filters-sidebar"
              style={{ background: "#fff", border: "1px solid #eef2ef", borderRadius: 16, padding: 24, position: "sticky", top: 96, display: "flex", flexDirection: "column", gap: 24 }}>
              <div className="filter-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: 0 }}>Filters</h3>
                <button className="clear-filters-btn"
                  onClick={() => {
                    setSelectedCategories(["all"]);
                    setMinPriceInput(initialMin || 0); setMaxPriceInput(initialMax || 0);
                    setAppliedMin(initialMin || 0); setAppliedMax(initialMax || 0);
                    setSelectedRating("all"); setSelectedTags([]); setSortBy("popular");
                    setAppliedSearch(""); setSearchQuery(""); setShowOnlyNew(false); setCurrentPage(1);
                  }}
                  style={{ background: "none", border: "none", color: PRIMARY, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Clear All
                </button>
              </div>

              {/* Category */}
              <div className="filter-group">
                <h4 className="filter-title" style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Category</h4>
                <div className="filter-options" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label className="filter-option" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, color: TEXT, cursor: "pointer", padding: "6px 8px", borderRadius: 6, borderLeft: `2px solid ${selectedCategories.includes("all") ? PRIMARY : "transparent"}`, background: selectedCategories.includes("all") ? MINT_BG : "transparent" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="checkbox" value="all" checked={selectedCategories.includes("all")} onChange={() => toggleCategory("all")} style={{ accentColor: PRIMARY }} />
                      All Templates
                    </span>
                    <span className="count" style={{ fontSize: 12, color: MUTED }}>{templates.length}</span>
                  </label>
                  {(backendCategories.length
                    ? backendCategories.map((cat) => ({ id: cat.id, name: cat.name || cat.id }))
                    : Array.from(new Set(templates.map((t) => t.category_name || t.category).filter(Boolean))).map((name) => ({ id: name, name }))
                  ).slice(0, showAllCategories ? undefined : 5).map((cat) => {
                    const categoryKey = (cat.name || cat.id || "").toLowerCase();
                    const count = categoryCounts[categoryKey] || 0;
                    const active = selectedCategories.includes(categoryKey);
                    return (
                      <label key={cat.id} className="filter-option" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, color: TEXT, cursor: "pointer", padding: "6px 8px", borderRadius: 6, borderLeft: `2px solid ${active ? PRIMARY : "transparent"}`, background: active ? MINT_BG : "transparent" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8, textTransform: "capitalize" }}>
                          <input type="checkbox" value={categoryKey} checked={active} onChange={() => toggleCategory(categoryKey)} style={{ accentColor: PRIMARY }} />
                          {cat.name || cat.id}
                        </span>
                        <span className="count" style={{ fontSize: 12, color: MUTED }}>{count}</span>
                      </label>
                    );
                  })}
                  {(backendCategories.length
                    ? backendCategories.length
                    : Array.from(new Set(templates.map((t) => t.category_name || t.category).filter(Boolean))).length
                  ) > 5 && (
                    <button type="button" onClick={() => setShowAllCategories(!showAllCategories)}
                      style={{ background: "none", border: "none", color: PRIMARY, cursor: "pointer", padding: "8px 0 0", fontSize: 13, fontWeight: 600, textAlign: "left" }}>
                      {showAllCategories ? "Show Less" : "Show More"}
                    </button>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="filter-group">
                <h4 className="filter-title" style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Price Range</h4>
                <div className="price-range">
                  <div className="price-inputs" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="number" id="minPrice" placeholder="Min" value={minPriceInput} onChange={(e) => setMinPriceInput(e.target.value)} style={inputStyle} />
                    <span style={{ color: MUTED }}>—</span>
                    <input type="number" id="maxPrice" placeholder="Max" value={maxPriceInput} onChange={(e) => setMaxPriceInput(e.target.value)} style={inputStyle} />
                  </div>
                  <button className="apply-price-btn" onClick={applyPriceRange}
                    style={{ marginTop: 12, width: "100%", background: PRIMARY, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 999, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    Apply
                  </button>
                </div>
              </div>

              {/* Rating */}
              <div className="filter-group">
                <h4 className="filter-title" style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Rating</h4>
                <div className="filter-options" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label className="filter-option" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: TEXT, cursor: "pointer" }}>
                    <input type="radio" name="rating" value="all" checked={selectedRating === "all"} onChange={() => setSelectedRating("all")} style={{ accentColor: PRIMARY }} />
                    <span>All Ratings</span>
                  </label>
                  <label className="filter-option" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: TEXT, cursor: "pointer" }}>
                    <input type="radio" name="rating" value="4" checked={selectedRating === "4"} onChange={() => setSelectedRating("4")} style={{ accentColor: PRIMARY }} />
                    <span>4★ & up</span>
                  </label>
                </div>
              </div>

              {/* Tags */}
              {/* <div className="filter-group">
                <h4 className="filter-title" style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Popular Tags</h4>
                <div className="tags-list" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {availableTags.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button key={tag} type="button" className={`tag-chip ${active ? "active" : ""}`} onClick={() => toggleTag(tag)}
                        style={{ background: active ? PRIMARY : MINT_TAG, color: active ? "#fff" : PRIMARY, border: "none", padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div> */}

              {/* New */}
              {/* <div className="filter-group" style={{ borderTop: "1px solid #eef2ef", paddingTop: 16 }}>
                <label className="filter-option" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: TEXT, cursor: "pointer" }}>
                  <input type="checkbox" checked={showOnlyNew} onChange={() => { setShowOnlyNew((s) => !s); setCurrentPage(1); }} style={{ accentColor: PRIMARY }} />
                  Show only New
                </label>
              </div> */}
            </aside>

            {/* CONTENT */}
            <div className="templates-content" style={{ minWidth: 0 }}>
              <div className="templates-toolbar" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div className="toolbar-left">
                  <p className="results-count" style={{ fontSize: 14, color: MUTED, margin: 0 }}>
                    Showing <strong style={{ color: TEXT }}>{startResult}{startResult ? `–${endResult}` : ""}</strong> of <strong style={{ color: TEXT }}>{totalResults}</strong> templates
                  </p>
                </div>
                <div className="toolbar-right" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div className="templates-search" style={{ display: "flex", border: "1px solid #d8e3da", borderRadius: 999, overflow: "hidden", background: "#fff" }}>
                    <input type="search" className="templates-search-input" placeholder="Search..."
                      value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const t = (searchQuery || "").trim();
                          setAppliedSearch(t);
                          setCurrentPage(1);
                        }
                      }}
                      style={{ border: "none", padding: "8px 14px", outline: "none", fontSize: 13, width: 160, background: "transparent" }} />
                    <button className="templates-search-btn"
                      onClick={() => {
                        const t = (searchQuery || "").trim();
                        setAppliedSearch(t);
                        setCurrentPage(1);
                      }}
                      style={{ background: PRIMARY, color: "#fff", border: "none", padding: "0 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                      🔍
                    </button>
                  </div>
                  <div className="view-toggle" style={{ display: "flex", background: "#fff", border: "1px solid #d8e3da", borderRadius: 8, padding: 3 }}>
                    <button type="button" className={`view-btn ${view === "grid" ? "active" : ""}`} onClick={() => setView("grid")}
                      style={{ background: view === "grid" ? MINT_BG : "transparent", color: view === "grid" ? PRIMARY : MUTED, border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>
                      ⊞
                    </button>
                    <button type="button" className={`view-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}
                      style={{ background: view === "list" ? MINT_BG : "transparent", color: view === "list" ? PRIMARY : MUTED, border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>
                      ☰
                    </button>
                  </div>
                  <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                    style={{ background: "#fff", border: "1px solid #d8e3da", borderRadius: 999, padding: "8px 14px", fontSize: 13, color: TEXT, cursor: "pointer", outline: "none" }}>
                    <option value="popular">Most Popular</option>
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>

              {listContent}

              {/* Pagination */}
              <div className="pagination templates-pagination" id="pagination"
                style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 48, marginBottom: 40 }}>
                <button className="page-btn" onClick={prevPage} disabled={currentPage === 1}
                  style={{ padding: "8px 16px", borderRadius: 999, border: "1px solid #d8e3da", background: "#fff", color: TEXT, fontSize: 13, fontWeight: 600, cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.5 : 1 }}>
                  Prev
                </button>
                {pageWindowStart > 1 && (<>
                  <button className="page-btn" onClick={() => goToPage(1)} style={pgBtn(false)}>1</button>
                  <span className="page-dots" style={{ color: MUTED }}>…</span>
                </>)}
                {pageNumbers.map((p) => (
                  <button key={p} className={`page-btn ${p === currentPage ? "active" : ""}`}
                    onClick={() => goToPage(p)} aria-current={p === currentPage ? "page" : undefined}
                    style={pgBtn(p === currentPage)}>
                    {p}
                  </button>
                ))}
                {pageWindowEnd < totalPages && (<>
                  <span className="page-dots" style={{ color: MUTED }}>…</span>
                  <button className="page-btn" onClick={() => goToPage(totalPages)} style={pgBtn(false)}>{totalPages}</button>
                </>)}
                <button className="page-btn" onClick={nextPage} disabled={currentPage === totalPages}
                  style={{ padding: "8px 16px", borderRadius: 999, border: "1px solid #d8e3da", background: "#fff", color: TEXT, fontSize: 13, fontWeight: 600, cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.5 : 1 }}>
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    
    </>
  );
}

// pagination button helper
function pgBtn(active) {
  return {
    width: 40, height: 40, borderRadius: 999,
    border: active ? "none" : "1px solid #d8e3da",
    background: active ? "#1a6b3a" : "#fff",
    color: active ? "#fff" : "#1a1a1a",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
  };
}

export default Templates;
