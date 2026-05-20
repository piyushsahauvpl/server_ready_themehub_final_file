import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "../assets/css/style.css";
import "../assets/css/blog-sidebar-enhancements.css";

export default function BlogDetails(){
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [latestPosts, setLatestPosts] = useState([]);
  const [latestLoading, setLatestLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

  useEffect(() => {
    let mounted = true;
    const fetchPost = async () => {
      try {
        const res = await fetch(`${API_URL}/blogs.php?id=${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error('Failed to load post');
        const json = await res.json();
        const p = json && json.data ? json.data : null;
        if (p && p.image_url && p.image_url.indexOf('http') !== 0) {
          const scheme = window.location.protocol === 'https:' ? 'https' : 'http';
          const host = window.location.host;
          const path = p.image_url.startsWith('/') ? p.image_url : '/' + p.image_url;
          p.image_url = scheme + '://' + host + path;
        }
        if (mounted) setPost(p);
      } catch (err) {
        console.error('Failed to fetch blog post', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPost();
    return () => { mounted = false; };
  }, [id, API_URL]);

  // fetch latest posts
  useEffect(() => {
    let mounted = true;
    const f = async () => {
      setLatestLoading(true);
      try {
        const res = await fetch(`${API_URL}/blogs.php?page=1&per_page=5`);
        if (!res.ok) throw new Error('Failed to load latest posts');
        const j = await res.json();
        const data = j && j.data ? j.data : [];
        if (mounted) setLatestPosts(data);
      } catch (e) {
        console.error('Failed to fetch latest posts', e);
      } finally {
        if (mounted) setLatestLoading(false);
      }
    };
    f();
    return () => { mounted = false; };
  }, [API_URL]);

  // fetch categories
  useEffect(() => {
    let mounted = true;
    const f = async () => {
      setCatsLoading(true);
      try {
        const res = await fetch(`${API_URL}/categories.php`);
        if (!res.ok) throw new Error('Failed to load categories');
        const j = await res.json();
        const data = j && j.data ? j.data : [];
        if (mounted) setCategories(data);
      } catch (e) {
        console.error('Failed to fetch categories', e);
      } finally {
        if (mounted) setCatsLoading(false);
      }
    };
    f();
    return () => { mounted = false; };
  }, [API_URL]);

  if (loading) return <main className="container" style={{padding:'6rem 0'}}>Loading…</main>;
  if (!post) return <main className="container" style={{padding:'6rem 0'}}><h2>Post not found</h2><button className="btn" onClick={() => navigate('/blog')}>Back to Blog</button></main>;

  return (
    <main>
      <section
        className="page-banner page-banner--image"
        style={{ padding: '5rem 0', backgroundImage: `url(${post.image_url || ''})` }}
        aria-label="Post banner"
      >
        <div className="page-banner__overlay" />
        <div className="container">
          <h1>{post.title}</h1>
          <p className="lead">{new Date(post.created_at).toLocaleDateString()} · {post.comments || 0} Comments</p>
        </div>
      </section>

      <section className="blog-detail" style={{ padding: '2.5rem 0' }}>
        <div className="container">
          <div className="content-grid">
            <article className="detail-card">
              {post.image_url && <img className="detail-image" src={post.image_url} alt={post.title} />}
              <div style={{ marginTop: 20 }}>
                <h2>{post.title}</h2>
                <div className="blog-meta" style={{ marginBottom: 16 }}>
                  <span>📅 {new Date(post.created_at).toLocaleDateString()}</span>
                  <span>💬 {post.comments || 0} Comments</span>
                </div>
                <div className="post-content">
                  <div dangerouslySetInnerHTML={{ __html: post.content || '' }} style={{ lineHeight: '1.8' }} />
                </div>
                <button className="btn" onClick={() => navigate('/blog')}>Back to Blog</button>
              </div>
            </article>

            <aside className="sidebar">
              <div className="filter-card">
                <h3>Search</h3>
                <div className="top-bar">
                  <div className="search-box">
                    <input type="text" placeholder="Search" />
                    <button className="search-btn">Search</button>
                  </div>
                </div>
              </div>

              <div className="filter-card">
                <h3>Latest Posts</h3>
                {latestLoading ? <p>Loading…</p> : (
                  <>
                    <ul className="latest-list">
                      {latestPosts.length === 0 ? <li>No posts</li> : latestPosts.map(lp => (
                        <li key={lp.id}>
                          <Link to={`/blog/${lp.slug || lp.id}`} className="latest-item">
                            <img src={lp.image_url || '/cs-assets/assets/img/placeholder.png'} alt={lp.title} />
                            <span>{lp.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div style={{ textAlign: 'right', marginTop: 8 }}><Link to="/blog" className="small-link">View all</Link></div>
                  </>
                )}
              </div>

              <div className="filter-card">
                <h3>Categories</h3>
                {catsLoading ? <p>Loading…</p> : (
                  <ul className="categories-list">
                    {categories.length === 0 ? <li>No categories</li> : categories.map(c => (
                      <li key={c.id}><Link to={`/allcategories?cat=${encodeURIComponent(c.slug || c.name)}`}>{c.name}</Link></li>
                    ))}
                  </ul>
                )}
              </div>

            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}
