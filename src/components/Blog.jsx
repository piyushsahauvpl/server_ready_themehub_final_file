import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MessageCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import "../pages/Templates.css";
import "./Blog.css";
import blogBannerImage from "../assets/images/blogimage.png";
import { Helmet } from "./SeoHelmet"; 

const Blog = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [latestPosts, setLatestPosts] = useState([]);
  const [categories, setCategories] = useState([]);

  const pageSize = 4;
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://uptulathemehub.com/backend/api";

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/blogs.php?page=${currentPage}&per_page=${pageSize}`
        );
        const json = await res.json();

        let items = [];
        let totalCount = 0;

        if (Array.isArray(json)) {
          items = json;
          totalCount = json.length;
        } else if (Array.isArray(json.data)) {
          items = json.data;
          totalCount = json.meta?.total || json.data.length;
        }

        items = items.map((p) => ({
          ...p,
          image_url: p.image_url || p.image || null
        }));

        setPosts(items);
        setTotal(totalCount);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [currentPage]);

  useEffect(() => {
    fetch(`${API_URL}/blogs.php?page=1&per_page=200`)
      .then((r) => r.json())
      .then((j) => setLatestPosts(j.data || []));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/categories.php`)
      .then((r) => r.json())
      .then((j) => setCategories(j.data || []));
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const goTo = (n) =>
    setCurrentPage(Math.min(Math.max(1, n), totalPages));

  return (
      <>
    <Helmet>
      <title>
        Best Professional Website Templates | Uptula Blog
      </title>

      <meta
        name="description"
        content="Stay updated with the best professional website templates, tips & trends on the UpTula blog. Build a stunning site with our expert guides. Start today"
      />
    </Helmet>
    
    <div className="blog-page">
      <section className="templates-banner blog-banner">
        <div className="container banner-content">
          <div className="templates-banner-copy">
            <span className="templates-banner-label">Blog & Articles</span>
            <h1>Insights, Guides & Inspiration from ThemeHub</h1>
            <p className="lead">
              Explore design tips, development guides, and proven trends for building premium websites and digital stores.
            </p>
          </div>
          <div className="blog-banner-visual" aria-hidden="true">
            <img src={blogBannerImage} alt="" />
          </div>

          <div className="templates-banner-card">
            <div className="templates-banner-card-top">
              <span>Featured article</span>
              <strong>Conversion-focused templates</strong>
            </div>
            <div className="templates-banner-card-info">
              <div>
                <p>Fresh Guides</p>
                <strong>Design & Development</strong>
              </div>
              <div>
                <p>For Creators</p>
                <strong>Trends that convert</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN */}
      <section className="container mx-auto py-16 grid lg:grid-cols-[1fr_320px] gap-10 max-w-[1200px] px-4 sm:px-6">

        {/* POSTS */}
        <div className="space-y-6">

          {loading ? (
            <p>Loading...</p>
          ) : posts.length === 0 ? (
            <p>No posts found</p>
          ) : (
            posts.map((item) => (
              <div
                key={item.id}
                className="post-card flex flex-col md:flex-row bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition"
              >
                <img
                  src={item.image_url || "https://via.placeholder.com/400"}
                  className="w-full md:w-64 h-52 object-cover"
                />

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex gap-3 text-xs mb-2">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      {item.category || "Blog"}
                    </span>
                    <span className="text-gray-400">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString()
                        : ""}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold mb-2">
                    {item.title}
                  </h2>

                  <p className="text-gray-600 text-sm mb-4">
                    {item.content?.replace(/<[^>]+>/g, "").substring(0, 140)}...
                  </p>

                  <div className="flex justify-between items-center">
                    <Link
                      to={`/blog/${item.slug || item.id}`}
                      className="bg-green-700 text-white px-4 py-2 rounded-full text-xs flex items-center gap-2"
                    >
                      Read Article <ArrowRight size={14} />
                    </Link>

                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <MessageCircle size={14} />
                      {item.comments || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* PAGINATION */}
          <div className="flex justify-center gap-2 pt-6">
            <button onClick={() => goTo(currentPage - 1)}>
              <ChevronLeft />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i + 1)}
                className={`w-8 h-8 rounded-full ${
                  currentPage === i + 1
                    ? "bg-green-700 text-white"
                    : "bg-white border"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button onClick={() => goTo(currentPage + 1)}>
              <ChevronRight />
            </button>
          </div>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-6">

          <div className="sidebar-card bg-white p-5 rounded-xl shadow-sm">
            <h3 className="font-semibold mb-3">Search</h3>
            <div className="flex bg-gray-100 rounded-full px-3 py-2">
              <Search size={16} />
              <input
                className="bg-transparent flex-1 px-2 text-sm outline-none"
                placeholder="Search..."
              />
            </div>
          </div>

          <div className="sidebar-card bg-white p-5 rounded-xl shadow-sm">
            <h3 className="font-semibold mb-4">
              Latest Posts
            </h3>

            {latestPosts.map((lp) => (
              <Link
                key={lp.id}
                to={`/blog/${lp.slug || lp.id}`}
                className="sidebar-link flex gap-3 mb-3"
              >
                <img
                  src={lp.image_url || "https://via.placeholder.com/100"}
                  className="w-14 h-14 rounded object-cover"
                />
                <span className="text-sm">
                  {lp.title}
                </span>
              </Link>
            ))}
          </div>

          <div className="sidebar-card bg-white p-5 rounded-xl shadow-sm">
            <h3 className="font-semibold mb-3">
              Categories
            </h3>

            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <span
                  key={c.id}
                  className="bg-gray-100 px-3 py-1 text-xs rounded-full"
                >
                  {c.name}
                </span>
              ))}
            </div>
          </div>

        </aside>
      </section>
    </div>
    </>
  );
};

export default Blog;
