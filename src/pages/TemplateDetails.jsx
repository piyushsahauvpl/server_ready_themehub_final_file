import React, { useContext, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../components/CartContext';
import { FiStar, FiHeart, FiShoppingCart, FiEye, FiCheckCircle, FiDownload, FiClock, FiMessageCircle, FiUser, FiHelpCircle } from 'react-icons/fi';
import TicketModal from '../components/TicketModal';

/* ─── ALL STYLES INLINED ─── */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

:root{
  --primary:#1a6b3a;
  --primary-dark:#0d5a30;
  --accent:#00c853;
  --bg-light:#f4f9f5;
  --bg-dark:#0d2b1a;
  --white:#ffffff;
  --text-dark:#1a1a1a;
  --text-muted:#666666;
  --border:#e0ede5;
  --badge-bg:#e8f5e9;
  --star:#f59e0b;
  --danger:#ef4444;
  --warning-bg:#fef3c7;
  --warning:#d97706;
}

.td-wrap *{box-sizing:border-box;margin:0;padding:0;font-family:'Poppins',sans-serif !important}
.td-wrap{font-family:'Poppins',sans-serif !important;font-size:14px;color:var(--text-dark);background:linear-gradient(180deg,#eef7f2 0,#fff 45%);line-height:1.55;-webkit-font-smoothing:antialiased;overflow-x:hidden;padding-bottom:40px}
.td-wrap a{text-decoration:none;color:inherit}
.td-wrap button{font-family:inherit;border:none;background:none;cursor:pointer}
.td-wrap ::selection{background:var(--badge-bg);color:var(--primary)}
.td-wrap h1,.td-wrap h2,.td-wrap h3,.td-wrap h4{font-family:'Poppins',sans-serif;color:var(--text-dark);line-height:1.25}

@keyframes td-fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes td-fadeInLeft{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
@keyframes td-fadeInRight{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
@keyframes td-pulseBadge{0%,100%{transform:scale(1)}50%{transform:scale(1.25)}}
@keyframes td-bounce{0%{transform:scale(1)}40%{transform:scale(1.4)}100%{transform:scale(1)}}
@keyframes td-imageAutoScroll{0%,12%{transform:translateY(0)}88%,100%{transform:translateY(calc(-100% + var(--td-preview-height)))}}

/* BREADCRUMB */
.td-breadcrumb{background:var(--bg-light);border-bottom:1px solid var(--border);padding:10px 0;animation:td-fadeIn .3s ease}
.td-breadcrumb-inner{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.td-crumbs{display:flex;align-items:center;gap:6px;font-size:13px}
.td-crumbs a{color:var(--text-muted);transition:color .2s;cursor:pointer}
.td-crumbs a:hover{color:var(--primary)}
.td-crumbs .sep{color:#ccc}
.td-crumbs .current{color:var(--text-dark);font-weight:700}
.td-crumbs .cat-chip{background:var(--badge-bg);color:var(--primary);border-radius:4px;padding:1px 8px;font-weight:600}
.td-share{display:flex;align-items:center;gap:8px}
.td-share-label{color:#999;font-size:12px}
.td-share-btn{width:32px;height:32px;border-radius:50%;border:1px solid var(--border);background:#fff;display:grid;place-items:center;color:var(--text-muted);transition:.2s;cursor:pointer}
.td-share-btn:hover{border-color:var(--primary);color:var(--primary)}

/* HERO GRID */
.td-hero{background:#fff;padding:44px 0 32px}
.td-container{max-width:1180px;margin:0 auto;padding:0 20px}
.td-hero-grid{display:grid;grid-template-columns:minmax(0,1fr) 400px;gap:48px;align-items:start}
.td-left-col{min-width:0;display:flex;flex-direction:column;gap:32px}

/* GALLERY */
.td-gallery{border-radius:24px;overflow:hidden;border:1px solid rgba(26,107,58,.08);box-shadow:0 18px 60px rgba(26,107,58,.08);animation:td-fadeInLeft .5s ease}
.td-preview{--td-preview-height:460px;position:relative;height:var(--td-preview-height);background:linear-gradient(135deg,#f7c948 0%,#f59e0b 45%,#d97706 100%);display:flex;flex-direction:column;overflow:hidden;border-radius:24px}
.td-preview img{width:100%;height:100%;object-fit:cover;display:block}
.td-preview-scroll img{height:auto;min-height:100%;object-fit:cover;object-position:top;animation:td-imageAutoScroll 14s ease-in-out infinite alternate;will-change:transform}
.td-preview-scroll:hover img{animation-play-state:paused}
.td-badge-bestseller{position:absolute;top:14px;left:14px;background:var(--star);color:#fff;font-weight:700;font-size:12px;padding:8px 14px;border-radius:999px;box-shadow:0 6px 20px rgba(0,0,0,.18);letter-spacing:.04em;z-index:2}
.td-badge-livepreview{position:absolute;top:14px;right:14px;background:var(--primary);color:#fff;padding:10px 18px;border-radius:999px;font-weight:700;font-size:13px;box-shadow:0 6px 20px rgba(26,107,58,.35);transition:.2s;cursor:pointer;z-index:2;white-space:nowrap}
.td-badge-livepreview:hover{background:var(--primary-dark)}
.td-thumbs{background:var(--bg-light);border-top:1px solid var(--border);padding:12px 16px;display:flex;align-items:center;gap:10px;overflow-x:auto}
.td-thumbs-label{font-size:12px;color:#999;flex-shrink:0;margin-right:4px}
.td-thumb{width:88px;height:64px;border-radius:8px;overflow:hidden;cursor:pointer;flex-shrink:0;border:2px solid transparent;transition:all .2s;position:relative}
.td-thumb:hover{border-color:var(--accent)}
.td-thumb.active{border-color:var(--primary);box-shadow:0 0 0 3px rgba(26,107,58,.15)}
.td-thumb img{width:100%;height:100%;object-fit:cover}

/* TITLE META */
.td-title-meta{margin-top:28px;display:flex;justify-content:space-between;align-items:flex-start;gap:20px;animation:td-fadeIn .5s ease .1s both}
.td-tm-pills{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.td-pill{border-radius:20px;padding:4px 14px;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:4px}
.td-pill-cat{background:var(--badge-bg);color:var(--primary)}
.td-pill-fw{background:#f0f4ff;color:#4f46e5}
.td-pill-new{background:#dcfce7;color:#16a34a;font-size:11px;font-weight:700;padding:4px 12px}
.td-product-title{font-size:36px;font-weight:800;color:var(--text-dark);margin-top:10px;line-height:1.2}
.td-author-row{margin-top:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px}
.td-author-row .lbl{color:#999}
.td-avatar{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent));color:#fff;font-weight:700;font-size:12px;display:grid;place-items:center}
.td-author-link{color:var(--primary);font-weight:600;font-size:14px;cursor:pointer}
.td-author-link:hover{text-decoration:underline}
.td-verified{background:var(--badge-bg);color:var(--primary);border-radius:20px;padding:2px 10px;display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600}
.td-last-update{font-size:12px;color:#999;white-space:nowrap}

/* STATS */
.td-stats{margin-top:20px;background:var(--bg-light);border-radius:14px;padding:16px 20px;display:flex;animation:td-fadeIn .5s ease .15s both}
.td-stat{flex:1;text-align:center;border-right:1px solid var(--border)}
.td-stat:last-child{border-right:none}
.td-stat-val{font-family:'Poppins',sans-serif;font-size:22px;font-weight:700;color:var(--primary)}
.td-stat-lbl{font-size:12px;color:var(--text-muted);margin-top:2px}

/* TABS */
.td-tabs{margin-top:28px;animation:td-fadeIn .5s ease .15s both}
.td-tab-nav{display:flex;border-bottom:2px solid var(--border);overflow-x:auto}
.td-tab-btn{padding:14px 20px;font-size:15px;font-weight:600;color:var(--text-muted);position:relative;white-space:nowrap;transition:color .2s;cursor:pointer;background:none;border:none;font-family:'Poppins',sans-serif}
.td-tab-btn:hover{color:var(--primary)}
.td-tab-btn.active{color:var(--primary)}
.td-tab-btn.active::after{content:'';position:absolute;bottom:-2px;left:0;right:0;height:3px;background:var(--primary);border-radius:2px 2px 0 0}
.td-tab-panel{background:#fff;border:1px solid var(--border);border-top:none;border-radius:0 0 16px 16px;padding:28px;display:none}
.td-tab-panel.active{display:block;animation:td-fadeIn .25s ease}

.td-section-title{font-family:'Poppins',sans-serif;font-size:18px;font-weight:700;color:var(--text-dark);margin-bottom:14px;position:relative;padding-bottom:8px}
.td-section-title::after{content:'';position:absolute;bottom:0;left:0;width:40px;height:2px;background:var(--primary)}
.td-desc-p{color:#555;font-size:15px;line-height:1.8;margin-bottom:12px}
.td-section-block+.td-section-block{margin-top:24px}

/* REVIEWS */
.td-reviews-top{background:var(--bg-light);border-radius:16px;padding:24px;display:flex;gap:40px;margin-bottom:24px;align-items:center}
.td-rev-left{text-align:center;flex-shrink:0}
.td-rev-big{font-family:'Poppins',sans-serif;font-size:72px;font-weight:800;line-height:1}
.td-rev-stars{color:var(--star);font-size:22px;margin-top:4px}
.td-rev-count{font-size:13px;color:#999;margin-top:4px}
.td-rev-bars{flex:1;display:flex;flex-direction:column;gap:8px}
.td-rev-bar{display:flex;align-items:center;gap:12px;font-size:13px;color:var(--text-muted)}
.td-rev-bar .lbl{width:24px}
.td-rev-bar .bar{flex:1;height:8px;background:var(--border);border-radius:4px;overflow:hidden}
.td-rev-bar .fill{height:100%;background:var(--star);border-radius:4px}
.td-rev-empty{text-align:center;padding:40px}
.td-rev-empty .ic{color:var(--border)}
.td-rev-empty h4{font-family:'Poppins',sans-serif;font-size:18px;color:#999;margin-top:10px}
.td-rev-empty p{font-size:14px;color:#bbb;margin-top:8px}
.td-btn-write{margin-top:20px;background:var(--primary);color:#fff;border-radius:8px;padding:12px 28px;font-family:'Poppins',sans-serif;font-size:14px;font-weight:600;transition:.2s;cursor:pointer;border:none}
.td-btn-write:hover{background:var(--primary-dark)}

/* REVIEW CARDS */
.td-reviews-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px}
.td-reviews-header h2{font-family:'Poppins',sans-serif;font-size:20px;font-weight:700;display:flex;align-items:center;gap:8px}
.td-review-card{background:#fff;border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px;transition:.2s}
.td-review-card:hover{box-shadow:0 4px 16px rgba(26,107,58,.08)}
.td-review-header{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px}
.td-reviewer-avatar{width:40px;height:40px;border-radius:50%;object-fit:cover}
.td-reviewer-avatar-placeholder{width:40px;height:40px;border-radius:50%;background:var(--bg-light);border:1px solid var(--border);display:grid;place-items:center;color:var(--text-muted)}
.td-reviewer-name{font-family:'Poppins',sans-serif;font-size:14px;font-weight:700}
.td-review-date{font-size:12px;color:#999;margin-top:2px}
.td-review-rating{display:flex;align-items:center;margin-left:auto}
.td-review-title{font-family:'Poppins',sans-serif;font-size:15px;font-weight:700;margin-bottom:6px}
.td-review-text{font-size:14px;color:#555;line-height:1.7}
.td-seller-reply{background:var(--bg-light);border-left:3px solid var(--primary);border-radius:0 8px 8px 0;padding:12px 16px;margin-top:12px}
.td-load-more{text-align:center;margin-top:20px}
.td-load-more button{padding:12px 30px;background:var(--primary);color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;transition:.2s;font-family:'Poppins',sans-serif}
.td-load-more button:hover{background:var(--primary-dark);transform:translateY(-2px)}

/* REVIEW FORM */
.td-review-form-card{background:var(--bg-light);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:24px}
.td-form-group{margin-bottom:16px}
.td-form-group label{display:block;font-size:13px;font-weight:600;color:var(--text-dark);margin-bottom:6px}
.td-form-group input,.td-form-group textarea{width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-size:14px;font-family:'Poppins',sans-serif;outline:none;transition:.2s;background:#fff}
.td-form-group input:focus,.td-form-group textarea:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(26,107,58,.08)}
.td-form-group textarea{resize:vertical}
.td-form-actions{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}
.td-rating-input{display:flex;gap:4px}
.td-star-btn{background:none;border:none;cursor:pointer;padding:4px}

/* SIDEBAR */
.td-sidebar{position:sticky;top:90px;animation:td-fadeInRight .5s ease .15s both}
.td-purchase-card{background:#fff;border:1px solid var(--border);border-radius:20px;padding:24px;box-shadow:0 8px 40px rgba(26,107,58,.12)}
.td-price-block{display:flex;justify-content:space-between;align-items:flex-start}
.td-price-main{font-family:'Poppins',sans-serif;font-size:36px;font-weight:800;color:var(--primary);line-height:1}
.td-price-sub{display:flex;align-items:center;gap:8px;margin-top:6px}
.td-price-old{text-decoration:line-through;color:#bbb;font-size:14px}
.td-price-off{background:var(--warning-bg);color:var(--warning);border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700}
.td-wishlist-btn{width:40px;height:40px;border-radius:50%;background:var(--bg-light);border:1px solid var(--border);display:grid;place-items:center;color:var(--text-muted);transition:.2s;cursor:pointer}
.td-wishlist-btn:hover,.td-wishlist-btn.active{background:#fef2f2;border-color:var(--danger);color:var(--danger)}
.td-urgency{margin-top:14px;background:var(--warning-bg);border-radius:8px;padding:8px 14px;display:flex;align-items:center;gap:8px;font-size:13px;color:var(--warning);font-weight:600}
.td-actions{margin-top:18px;display:flex;flex-direction:column;gap:10px}
.td-btn{width:100%;padding:15px;border-radius:10px;font-family:'Poppins',sans-serif;font-size:16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .25s;cursor:pointer;border:none}
.td-btn-cart{
  appearance:none;
  background:linear-gradient(135deg,#1a6b3a 0%, #14552f 100%) !important;
  background-color:#1a6b3a !important;
  color:#fff !important;
  border:1px solid #1a6b3a;
  box-shadow:0 4px 20px rgba(26,107,58,.3);
}
.td-btn-cart svg,
.td-btn-cart span,
.td-btn-cart{
  color:#fff !important;
  fill:currentColor;
  stroke:currentColor;
  -webkit-text-fill-color:#fff !important;
}
.td-btn-cart:hover{background:linear-gradient(135deg,#15512d 0%, #0f4525 100%) !important;box-shadow:0 6px 24px rgba(26,107,58,.45)}
.td-btn-cart:active{transform:scale(.98)}
.td-btn-cart.added{background:var(--accent)}
.td-btn-preview-act{
  appearance:none;
  background:linear-gradient(135deg,#1a6b3a 0%, #14552f 100%) !important;
  background-color:#1a6b3a !important;
  border:2px solid #1a6b3a;
  color:#fff !important;
  padding:13px;
  font-size:15px;
  font-family:'Poppins',sans-serif;
  font-weight:600;
}
.td-btn-preview-act svg,
.td-btn-preview-act span,
.td-btn-preview-act{
  color:#fff !important;
  fill:currentColor;
  stroke:currentColor;
  -webkit-text-fill-color:#fff !important;
}
.td-btn-preview-act:hover{background:linear-gradient(135deg,#15512d 0%, #0f4525 100%) !important}
.td-btn-buy{background:linear-gradient(135deg,#00c853 0%,#1a6b3a 100%);color:#fff;font-size:15px;box-shadow:0 4px 24px rgba(0,200,83,.35);background-size:200% 200%;background-position:0% 50%;transition:background-position .5s ease,box-shadow .25s}
.td-btn-buy:hover{background-position:100% 50%;box-shadow:0 6px 28px rgba(0,200,83,.5)}
.td-trust{margin-top:18px;display:flex}
.td-trust-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;border-right:1px solid var(--border);padding:0 6px;text-align:center}
.td-trust-item:last-child{border-right:none}
.td-trust-item .ic{color:var(--primary);font-size:18px}
.td-trust-item .lbl{font-size:10px;color:var(--text-muted)}
.td-divider{height:1px;background:#f0f0f0;margin:18px 0}
.td-quick-specs{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.td-qs{background:var(--bg-light);border-radius:8px;padding:8px 12px}
.td-qs .l{font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.05em}
.td-qs .v{font-size:13px;color:var(--text-dark);font-weight:700;display:block;margin-top:2px}
.td-tags{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.td-tags .tl{font-size:12px;color:#999;margin-right:4px}
.td-tag{background:var(--badge-bg);color:var(--primary);border-radius:20px;padding:3px 10px;font-size:12px;cursor:pointer;transition:.2s}
.td-tag:hover{background:var(--primary);color:#fff}

/* SELLER */
.td-seller-card{background:#fff;border:1px solid var(--border);border-radius:16px;padding:20px;margin-top:16px}
.td-seller-row{display:flex;gap:12px;margin-top:14px;align-items:flex-start}
.td-seller-avatar{width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent));color:#fff;font-family:'Poppins',sans-serif;font-size:22px;font-weight:700;display:grid;place-items:center;flex-shrink:0}
.td-seller-info{flex:1;min-width:0}
.td-seller-info h4{font-family:'Poppins',sans-serif;font-size:16px;font-weight:700}
.td-seller-rating{display:flex;align-items:center;gap:4px;margin-top:3px;color:var(--star);font-size:14px}
.td-seller-rating .num{color:var(--text-muted);font-size:13px;margin-left:4px}
.td-seller-meta{display:flex;align-items:center;gap:6px;margin-top:4px;font-size:12px;color:var(--primary);flex-wrap:wrap}
.td-seller-meta .ms{color:#999}
.td-seller-stats{display:flex;background:var(--bg-light);border-radius:10px;padding:12px;margin-top:14px}
.td-seller-stat{flex:1;text-align:center;border-right:1px solid var(--border)}
.td-seller-stat:last-child{border-right:none}
.td-seller-stat .v{font-family:'Poppins',sans-serif;font-size:18px;font-weight:700;color:var(--primary)}
.td-seller-stat .l{font-size:11px;color:#999;display:block;margin-top:2px}
.td-seller-btns{display:flex;gap:8px;margin-top:14px}
.td-sb-view{flex:1;background:var(--badge-bg);color:var(--primary);border-radius:8px;padding:10px;text-align:center;font-size:13px;font-weight:600;transition:.2s;cursor:pointer}
.td-sb-view:hover{background:var(--primary);color:#fff}
.td-sb-contact{flex:1;border:1px solid var(--border);color:var(--text-muted);border-radius:8px;padding:10px;text-align:center;font-size:13px;transition:.2s;cursor:pointer;background:#fff}
.td-sb-contact:hover{border-color:var(--primary);color:var(--primary)}

/* FEATURES */
.td-feat-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.td-feat-card{background:var(--bg-light);border-radius:12px;padding:16px;border-left:3px solid var(--primary);transition:.25s}
.td-feat-card:hover{background:#fff;box-shadow:0 6px 20px rgba(0,0,0,.06)}
.td-feat-icon{font-size:22px;color:var(--primary)}
.td-feat-title{font-family:'Poppins',sans-serif;font-size:14px;font-weight:700;margin-top:6px}
.td-feat-desc{font-size:13px;color:var(--text-muted);margin-top:4px}
.td-specs{border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-top:12px}
.td-spec-row{display:flex;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--bg-light)}
.td-spec-row:nth-child(even){background:#fafffe}
.td-spec-row:last-child{border-bottom:none}
.td-spec-row .sl{font-size:13px;color:#999;font-weight:500}
.td-spec-row .sv{font-size:13px;color:var(--text-dark);font-weight:600}

/* BROWSERS */
.td-browsers-card{background:var(--bg-light);border:1px solid var(--border);border-radius:12px;padding:16px;margin-top:16px}
.td-browsers-card h4{font-family:'Poppins',sans-serif;font-size:13px;font-weight:700}
.td-browsers{display:flex;gap:8px;margin-top:10px}
.td-br{width:32px;height:32px;border-radius:50%;background:#fff;border:1px solid var(--border);display:grid;place-items:center;font-weight:700;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,.06)}
.td-br.c1{color:#4285F4}.td-br.c2{color:#FF7139}.td-br.c3{color:#0FB5EE}.td-br.c4{color:#0078D7}.td-br.c5{color:#FF1B2D}

/* EDIT/ACTION BUTTONS */
.td-btn-edit{background:none;border:none;color:var(--primary);cursor:pointer;font-weight:600;font-family:'Poppins',sans-serif;font-size:13px;padding:4px 8px;border-radius:6px;transition:.2s}
.td-btn-edit:hover{background:var(--badge-bg)}
.td-btn-delete{background:none;border:none;color:var(--danger);cursor:pointer;font-weight:600;font-family:'Poppins',sans-serif;font-size:13px;padding:4px 8px;border-radius:6px;transition:.2s}
.td-btn-delete:hover{background:#fef2f2}
.td-btn-cancel{padding:10px 20px;background:transparent;color:#666;border:1px solid var(--border);border-radius:8px;cursor:pointer;font-family:'Poppins',sans-serif;font-size:14px;transition:.2s}
.td-btn-cancel:hover{border-color:var(--primary);color:var(--primary)}
.td-btn-submit{padding:10px 20px;background:var(--primary);color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-family:'Poppins',sans-serif;font-size:14px;transition:.2s}
.td-btn-submit:hover{background:var(--primary-dark)}
.td-btn-submit:disabled{opacity:.6;cursor:not-allowed}
.td-btn-write-review{padding:10px 20px;background:var(--primary);color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-family:'Poppins',sans-serif;font-size:14px;transition:.2s}
.td-btn-write-review:hover{background:var(--primary-dark)}

/* NO REVIEWS */
.td-no-reviews{text-align:center;padding:48px 24px;background:var(--bg-light);border-radius:16px;border:1px dashed var(--border)}
.td-no-reviews p{font-size:15px;color:#999;margin-top:8px}

/* LOADING / ERROR */
.td-loading{padding:80px 20px;text-align:center;font-family:'Poppins',sans-serif;font-size:18px;color:var(--text-muted)}
.td-error{padding:80px 20px;text-align:center}
.td-error p{font-family:'Poppins',sans-serif;font-size:18px;color:var(--text-muted);margin-bottom:16px}
.td-error button{padding:12px 24px;background:var(--primary);color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px}

/* RESPONSIVE */
@media(max-width:1024px){
  .td-hero-grid{grid-template-columns:1fr;gap:32px}
  .td-sidebar{position:static;width:100%}
  .td-purchase-card{max-width:none;margin-top:20px}
  .td-hero{padding:32px 0}
  .td-container{padding:0 24px}
  .td-thumbs{padding:12px 10px}
  .td-thumbs-label{margin-right:6px}
  .td-tab-nav{gap:10px;}
  .td-purchase-card{padding:24px}
  .td-trust{gap:12px}
  .td-browsers{flex-wrap:wrap;gap:10px}
}
@media(max-width:768px){
  .td-wrap{background:linear-gradient(180deg,#eef7f2 0,#fff 42%)}
  .td-breadcrumb{padding:12px 0}
  .td-breadcrumb-inner{align-items:flex-start;gap:12px}
  .td-crumbs{max-width:100%;overflow-x:auto;padding-bottom:2px;white-space:nowrap;-webkit-overflow-scrolling:touch}
  .td-crumbs .current{max-width:220px;overflow:hidden;text-overflow:ellipsis}
  .td-share{width:100%;justify-content:flex-start;gap:10px;flex-wrap:wrap}
  .td-hero{padding:26px 0}
  .td-container{padding:0 16px}
  .td-hero-grid{gap:24px}
  .td-gallery{border-radius:22px;box-shadow:0 18px 60px rgba(26,107,58,.14)}
  .td-preview{--td-preview-height:clamp(320px,56vw,420px)}
  .td-badge-bestseller{top:12px;left:12px;font-size:11px;padding:6px 10px}
  .td-badge-livepreview{top:12px;right:12px;font-size:12px;padding:8px 12px}
  .td-product-title{font-size:28px}
  .td-title-meta{flex-direction:column;gap:16px}
  .td-title-meta > div{width:100%}
  .td-last-update{margin-top:10px}
  .td-tabs{margin-top:22px}
  .td-tab-nav{gap:8px;border-bottom:0;padding:4px 2px 10px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
  .td-tab-btn{border:1px solid var(--border);border-radius:999px;background:#fff;box-shadow:0 5px 18px rgba(26,107,58,.08);scroll-snap-align:start}
  .td-tab-btn.active{background:var(--primary);color:#fff;border-color:var(--primary)}
  .td-tab-btn.active::after{display:none}
  .td-tab-btn{padding:12px 16px;font-size:14px}
  .td-tab-panel{padding:14px 14px 16px}
  .td-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px;background:transparent}
  .td-stat{border-right:none;background:var(--bg-light);border:1px solid var(--border);border-radius:14px;padding:12px 10px;min-width:0}
  .td-stat-val{font-size:18px;word-break:break-word}
  .td-thumbs{flex-wrap:wrap;gap:8px}
  .td-thumb{width:84px;height:60px}
  .td-feat-grid{grid-template-columns:1fr}
  .td-reviews-top{flex-direction:column;gap:20px}
  .td-purchase-card{border-radius:22px;padding:22px;box-shadow:0 18px 60px rgba(26,107,58,.16)}
  .td-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .td-btn{min-height:48px}
  .td-btn-cart,.td-btn-preview-act{width:100%}
  .td-trust{background:var(--bg-light);border:1px solid var(--border);border-radius:14px;padding:12px 10px}
  .td-trust-item{padding:10px 8px}
  .td-quick-specs{grid-template-columns:1fr}
  .td-seller-row{align-items:center;gap:12px}
  .td-seller-stats{flex-wrap:wrap}
  .td-browsers{flex-wrap:wrap;gap:10px}
  .td-purchase-card{max-width:100%}
  .td-seller-btns{flex-direction:column}
  .td-hero-grid{grid-template-columns:1fr}
}
@media(max-width:480px){
  .td-hero{padding:16px 0}
  .td-container{padding:0 14px}
  .td-preview{--td-preview-height:340px}
  .td-product-title{font-size:23px;line-height:1.25}
  .td-author-row{align-items:center}
  .td-avatar{width:26px;height:26px}
  .td-verified{font-size:10px;padding:2px 8px}
  .td-tab-panel{padding:12px 12px 14px}
  .td-price-main{font-size:28px}
  .td-thumbs{padding:10px 12px}
  .td-thumb{width:66px;height:48px}
  .td-stats{grid-template-columns:1fr 1fr;margin-top:16px;gap:8px;padding:0}
  .td-stat{padding:10px 6px}
  .td-stat-val{font-size:16px}
  .td-stat-lbl{font-size:11px}
  .td-author-row{font-size:12px;gap:6px}
  .td-btn{font-size:15px;padding:14px}
  .td-actions{grid-template-columns:1fr}
  .td-tab-btn{padding:10px 12px;font-size:13px}
  .td-reviews-top{padding:18px}
  .td-rev-big{font-size:52px}
  .td-rev-bar{gap:8px}
  .td-review-card{padding:16px}
  .td-review-header{align-items:flex-start}
  .td-review-rating{margin-left:0;width:100%}
  .td-review-form-card{padding:18px}
  .td-quick-specs{grid-template-columns:1fr}
  .td-tags{gap:4px}
  .td-seller-card{padding:16px}
  .td-seller-row{flex-direction:row;align-items:flex-start}
  .td-seller-btns{flex-direction:column}
  .td-browsers{flex-wrap:wrap}
  .td-price-off{font-size:10px;padding:2px 8px}
}
@media(max-width:360px){
  .td-container{padding:0 10px}
  .td-preview{--td-preview-height:300px}
  .td-product-title{font-size:21px}
  .td-price-block{gap:12px}
  .td-price-main{font-size:25px}
  .td-purchase-card{padding:16px}
  .td-trust{display:grid;grid-template-columns:1fr;gap:10px}
  .td-trust-item{border-right:0;border-bottom:1px solid var(--border);padding:0 0 10px}
  .td-trust-item:last-child{border-bottom:0;padding-bottom:0}
}
`;

function TemplateDetails(){
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsPerPage] = useState(3);
  const [displayedReviews, setDisplayedReviews] = useState(3);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', review_text: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 5, title: '', review_text: '' });
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [activeTab, setActiveTab] = useState('desc');
  const [cartAdded, setCartAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const thumbsRef = useRef(null);
  const scrollDirection = useRef(1);
  const scrollInterval = useRef(null);

  const startThumbsAutoScroll = () => {
    const container = thumbsRef.current;
    if (!container || scrollInterval.current) return;
    scrollInterval.current = setInterval(() => {
      if (!container) return;
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 0) return;
      if (container.scrollLeft >= maxScroll) scrollDirection.current = -1;
      if (container.scrollLeft <= 0) scrollDirection.current = 1;
      container.scrollLeft += scrollDirection.current * 1;
    }, 16);
  };

  const stopThumbsAutoScroll = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (scrollInterval.current) clearInterval(scrollInterval.current);
    };
  }, []);

  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

  // ── all original logic unchanged ──
  const handleEditClick = (review) => {
    setEditingReviewId(review.id);
    setEditForm({ rating: review.rating, title: review.title || '', review_text: review.review_text || '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) { navigate('/login'); return; }
    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_URL}/reviews.php`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ product_id: product.id, rating: editForm.rating, title: editForm.title, review_text: editForm.review_text })
      });
      const data = await res.json();
      if (data.success) { setEditingReviewId(null); setEditForm({ rating: 5, title: '', review_text: '' }); fetchReviews(); }
      else alert(data.message || 'Failed to update review');
    } catch { alert('Failed to update review'); }
    finally { setSubmittingReview(false); }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;
    setDeletingReviewId(reviewId);
    try {
      const res = await fetch(`${API_URL}/reviews.php`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ review_id: reviewId })
      });
      const data = await res.json();
      if (data.success) fetchReviews();
      else alert(data.message || 'Failed to delete review');
    } catch { alert('Failed to delete review'); }
    finally { setDeletingReviewId(null); }
  };

  useEffect(() => { checkAuth(); fetchProduct(); fetchReviews(); }, [slug]);
  useEffect(() => { window.scrollTo(0, 0); }, [slug]);
  useEffect(() => { if (product && currentUser) checkWishlist(); }, [product, currentUser]);
  useEffect(() => { if (product) fetchReviews(); }, [product]);
  useEffect(() => { if (product) setSelectedImage(product.image_url || null); }, [product]);

  const checkAuth = async () => {
    try {
      const res = await fetch(`${API_URL}/check-auth.php`, { credentials: 'include' });
      const data = await res.json();
      if (data.authenticated && data.user) setCurrentUser(data.user);
    } catch (err) { console.error('Auth check error:', err); }
  };

  const checkWishlist = async () => {
    if (!currentUser || !product) return;
    try {
      const res = await fetch(`${API_URL}/check-wishlist.php?product_id=${product.id}`, { credentials: 'include' });
      const data = await res.json();
      setInWishlist(data.in_wishlist || false);
    } catch (err) { console.error('Wishlist check error:', err); }
  };

  const toggleWishlist = async () => {
    if (!currentUser) { navigate('/login'); return; }
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        const res = await fetch(`${API_URL}/wishlist.php`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ product_id: product.id }) });
        const data = await res.json();
        if (data.success) {
          setInWishlist(false);
          window.dispatchEvent(new CustomEvent('wishlistChange'));
        }
      } else {
        const res = await fetch(`${API_URL}/wishlist.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ product_id: product.id }) });
        const data = await res.json();
        if (data.success) {
          setInWishlist(true);
          window.dispatchEvent(new CustomEvent('wishlistChange'));
        }
      }
    } catch (err) { console.error('Wishlist toggle error:', err); }
    finally { setWishlistLoading(false); }
  };

  const fetchProduct = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/products.php?id=${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (data.success && data.data) setProduct(data.data);
      else setError('Product not found');
    } catch (err) { console.error('Product fetch error:', err); setError('Failed to load product'); }
    finally { setLoading(false); }
  };

  const fetchReviews = async () => {
    if (!product) return;
    try {
      const res = await fetch(`${API_URL}/reviews.php?product_id=${product.id}`);
      const data = await res.json();
      if (data.success) { setReviews(data.reviews || []); setAverageRating(data.average_rating || 0); setTotalReviews(data.total_reviews || 0); }
    } catch (err) { console.error('Reviews fetch error:', err); }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) { navigate('/login'); return; }
    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_URL}/reviews.php`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ product_id: product.id, rating: reviewForm.rating, title: reviewForm.title, review_text: reviewForm.review_text })
      });
      const data = await res.json();
      if (data.success) { alert('Review submitted successfully!'); setShowReviewForm(false); setReviewForm({ rating: 5, title: '', review_text: '' }); fetchReviews(); }
      else alert(data.message || 'Failed to submit review');
    } catch (err) { console.error('Review submit error:', err); alert('Failed to submit review'); }
    finally { setSubmittingReview(false); }
  };

  const handleAddToCart = () => {
    addToCart({ id: tpl?.id, title: tpl?.title, price: Number(tpl?.price ?? 0), image: tpl?.image });
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 1500);
  };

  const renderStars = (rating) => Array.from({ length: 5 }).map((_, i) => (
    <FiStar key={i} style={{ color: i < Math.floor(rating) ? '#fbbf24' : '#d1d5db', fill: i < Math.floor(rating) ? '#fbbf24' : 'none', fontSize: '16px' }} />
  ));

  // ── loading / error states ──
  if (loading) return (
    <div className="td-wrap">
      <style>{styles}</style>
      <div className="td-loading">Loading product details…</div>
    </div>
  );

  if (error || !product) return (
    <div className="td-wrap">
      <style>{styles}</style>
      <div className="td-error">
        <p>{error || 'Product not found'}</p>
        <button onClick={() => navigate('/')}>Go to Home</button>
      </div>
    </div>
  );

  const tpl = {
    id: product.id,
    title: product.name || product.title,
    author: product.seller_name || product.seller_full_name || 'Admin',
    price: product.price,
    old_price: product.offer_price,
    image: product.image_url,
    description: product.description || '',
    preview_url: product.preview_url,
    rating: averageRating || 5,
    downloads: product.downloads || 0,
    last_update: product.last_update || product.created_at,
    category: product.category_name || product.category,
    framework: product.framework_name || product.framework,
    high_resolution: product.high_resolution,
    compatible_browsers: product.compatible_browsers,
    compatible_with: product.compatible_with,
    themeforest_files_included: product.themeforest_files_included,
    documentation: product.documentation || 'Well Documented',
    layout: product.layout || 'Responsive',
    tags: product.tags
  };

  const galleryImages = (product.gallery?.length && product.gallery) || (product.additional_images?.length && product.additional_images) || (product.image_url ? [product.image_url] : []);

  const authorInitial = (tpl.author || 'A').charAt(0).toUpperCase();
  const discountPct = tpl.old_price ? Math.round((1 - tpl.price / tpl.old_price) * 100) : null;
  const lastUpdateStr = tpl.last_update ? new Date(tpl.last_update).toLocaleDateString() : new Date(product.created_at || Date.now()).toLocaleDateString();

  // rating distribution (placeholder bars since no breakdown from API)
  const ratingDist = [5, 4, 3, 2, 1].map(s => ({ star: s, pct: s === Math.round(averageRating) && totalReviews > 0 ? 100 : 0, count: s === Math.round(averageRating) ? totalReviews : 0 }));

  return (
    <>
      <style>{styles}</style>
      <TicketModal isOpen={showTicketModal} onClose={() => setShowTicketModal(false)} productId={product?.id || null} productName={product?.name || product?.title || null} />

      <div className="td-wrap">

        {/* BREADCRUMB */}
        <div className="td-breadcrumb">
          <div className="td-container">
            <div className="td-breadcrumb-inner">
              <div className="td-crumbs">
                <a onClick={() => navigate('/')}>Home</a><span className="sep">›</span>
                <a onClick={() => navigate('/templates')}>Templates</a><span className="sep">›</span>
                <a className="cat-chip">{tpl.category || 'Templates'}</a><span className="sep">›</span>
                <span className="current">{tpl.title}</span>
              </div>
              <div className="td-share">
                <span className="td-share-label">Share:</span>
                <button className="td-share-btn" aria-label="Twitter" onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(tpl.title)}`, '_blank')}>
                  <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M22 5.8a8.5 8.5 0 0 1-2.36.65 4.13 4.13 0 0 0 1.81-2.27 8.21 8.21 0 0 1-2.61 1 4.1 4.1 0 0 0-7 3.74 11.64 11.64 0 0 1-8.45-4.29 4.16 4.16 0 0 0 1.27 5.49A4.09 4.09 0 0 1 2.8 9.7v.05a4.1 4.1 0 0 0 3.3 4 4.07 4.07 0 0 1-1.85.07 4.11 4.11 0 0 0 3.83 2.85A8.22 8.22 0 0 1 2 18.41 11.6 11.6 0 0 0 8.29 20 11.59 11.59 0 0 0 20 8.29v-.53A8.43 8.43 0 0 0 22 5.8z"/></svg>
                </button>
                <button className="td-share-btn" aria-label="Facebook" onClick={() => window.open(`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}>
                  <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12a10 10 0 1 0-11.56 9.88v-7H7.9V12h2.54V9.8c0-2.51 1.49-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.88h-2.33v7A10 10 0 0 0 22 12z"/></svg>
                </button>
                <button className="td-share-btn" aria-label="LinkedIn" onClick={() => window.open(`https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}>
                  <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.34 18.34H5.67v-8.59h2.67v8.59zM7 8.57a1.55 1.55 0 1 1 0-3.1 1.55 1.55 0 0 1 0 3.1zm11.34 9.77h-2.67v-4.18c0-1 0-2.27-1.39-2.27s-1.6 1.08-1.6 2.2v4.25h-2.67v-8.59h2.56V11h.04a2.81 2.81 0 0 1 2.53-1.39c2.7 0 3.2 1.78 3.2 4.1v4.63z"/></svg>
                </button>
                <button className="td-share-btn" aria-label="Copy link" onClick={() => { navigator.clipboard?.writeText(window.location.href); }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* HERO */}
        <section className="td-hero">
          <div className="td-container">
            <div className="td-hero-grid">

              {/* LEFT COLUMN */}
              <div className="td-left-col">

                {/* Gallery */}
                <div className="td-gallery">
                  <div className="td-preview td-preview-scroll" id="td-preview">
                    {tpl.downloads > 2000 && <div className="td-badge-bestseller">★ BEST SELLER</div>}
                    {tpl.preview_url && (
                      <a href={tpl.preview_url} target="_blank" rel="noopener noreferrer" className="td-badge-livepreview">LIVE PREVIEW →</a>
                    )}
                    {tpl.image ? (
                      <img id="td-mainImg" src={selectedImage || tpl.image} alt={tpl.title} onError={e => { e.target.style.display='none'; }} />
                    ) : (
                      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.6)', fontFamily:'Poppins, sans-serif', fontSize:'18px' }}>No Preview Available</div>
                    )}
                  </div>
                  {galleryImages.length > 1 && (
                    <div
                      className="td-thumbs"
                      ref={thumbsRef}
                      onMouseEnter={startThumbsAutoScroll}
                      onMouseLeave={stopThumbsAutoScroll}
                      onFocus={startThumbsAutoScroll}
                      onBlur={stopThumbsAutoScroll}
                    >
                      {galleryImages.map((img, index) => (
                        <div
                          key={index}
                          className={`td-thumb${img === (selectedImage || tpl.image) ? ' active' : ''}`}
                          onClick={() => setSelectedImage(img)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedImage(img); }}
                        >
                          <img src={img} alt={`${tpl.title} preview ${index + 1}`} onError={e => { e.target.style.display='none'; }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Title & meta */}
                <div className="td-title-meta">
                  <div>
                    <h1 className="td-product-title">{tpl.title}</h1>
                    <div className="td-author-row">
                      <span className="lbl">Created by</span>
                      <span className="td-avatar">{authorInitial}</span>
                      <span className="td-author-link">{tpl.author}</span>
                      <span className="td-verified">
                        <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V5l-8-3zm-1 14-4-4 1.4-1.4L11 13.2l4.6-4.6L17 10l-6 6z"/></svg>
                        Verified Seller
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="td-stats">
                  <div className="td-stat"><div className="td-stat-val">★ {averageRating > 0 ? averageRating.toFixed(1) : '5.0'}</div><div className="td-stat-lbl">Average Rating</div></div>
                  <div className="td-stat"><div className="td-stat-val">💬 {totalReviews}</div><div className="td-stat-lbl">Reviews</div></div>
                  <div className="td-stat"><div className="td-stat-val">⬇ {tpl.downloads}</div><div className="td-stat-lbl">Downloads</div></div>
                  <div className="td-stat"><div className="td-stat-val">🕐 {lastUpdateStr}</div><div className="td-stat-lbl">Last Update</div></div>
                </div>

                {/* TABS */}
                <div className="td-tabs">
                  <div className="td-tab-nav">
                    {[
                      { key: 'desc', label: '📄 Description' },
                      { key: 'feat', label: '⭐ Features' },
                      { key: 'rev',  label: `💬 Reviews (${totalReviews})` },
                      { key: 'cl',   label: '📋 Changelog' },
                      { key: 'faq',  label: '❓ FAQ' },
                    ].map(t => (
                      <button key={t.key} className={`td-tab-btn${activeTab === t.key ? ' active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>
                    ))}
                  </div>

                  {/* DESCRIPTION */}
                  <div className={`td-tab-panel${activeTab === 'desc' ? ' active' : ''}`}>
                    <div className="td-section-block">
                      <h3 className="td-section-title">About This Template</h3>
                      <div className="td-desc-p" dangerouslySetInnerHTML={{ __html: tpl.description || 'No description available.' }} />
                    </div>
                    {tpl.themeforest_files_included && typeof tpl.themeforest_files_included === 'string' && (
                      <div className="td-section-block">
                        <h3 className="td-section-title">What's Included</h3>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginTop:'8px' }}>
                          {tpl.themeforest_files_included.split(',').map((f, i) => (
                            <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', fontSize:'14px', color:'#333' }}>
                              <span style={{ width:'20px', height:'20px', borderRadius:'50%', background:'var(--primary)', color:'#fff', display:'grid', placeItems:'center', fontSize:'12px', flexShrink:0 }}>✓</span>
                              {f.trim()}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {tpl.tags && typeof tpl.tags === 'string' && (
                      <div className="td-section-block">
                        <h3 className="td-section-title">Use Cases</h3>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginTop:'8px' }}>
                          {tpl.tags.split(',').map((tag, i) => (
                            <span key={i} style={{ border:'1px solid var(--border)', color:'#555', borderRadius:'20px', padding:'6px 16px', fontSize:'13px', cursor:'pointer', transition:'.2s' }}
                              onMouseEnter={e => { e.target.style.background='var(--badge-bg)'; e.target.style.borderColor='var(--primary)'; e.target.style.color='var(--primary)'; }}
                              onMouseLeave={e => { e.target.style.background=''; e.target.style.borderColor='var(--border)'; e.target.style.color='#555'; }}>
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FEATURES */}
                  <div className={`td-tab-panel${activeTab === 'feat' ? ' active' : ''}`}>
                    <div className="td-feat-grid">
                      {[
                        { icon:'📱', title:'Mobile Responsive', desc:'Looks great on all screens' },
                        { icon:'⚡', title:'Fast Performance', desc:'Under 3s load time' },
                        { icon:'🎨', title:'Easy Customization', desc:'Change colors instantly' },
                        { icon:'📄', title:'Well Documented', desc:'Step-by-step setup guide' },
                        { icon:'🔍', title:'High Resolution', desc:'Retina display ready' },
                        { icon:'🌐', title:'Cross-browser', desc:'Chrome, Firefox, Safari, Edge' },
                        { icon:'🔒', title:'Clean Code', desc:'W3C validated markup' },
                        { icon:'🔄', title:'Free Updates', desc:'Lifetime update support' },
                      ].map((f,i) => (
                        <div key={i} className="td-feat-card">
                          <div className="td-feat-icon">{f.icon}</div>
                          <div className="td-feat-title">{f.title}</div>
                          <div className="td-feat-desc">{f.desc}</div>
                        </div>
                      ))}
                    </div>
                    <div className="td-section-block" style={{ marginTop:'24px' }}>
                      <h3 className="td-section-title">Technical Specifications</h3>
                      <div className="td-specs">
                        {[
                          ['Category', tpl.category],
                          ['Framework', tpl.framework],
                          ['Responsive', tpl.layout || 'Yes — All Devices'],
                          ['Documentation', tpl.documentation],
                          ['Compatible Browsers', tpl.compatible_browsers],
                          ['Compatible With', tpl.compatible_with],
                          ['Last Update', lastUpdateStr],
                          ['Downloads', tpl.downloads],
                        ].filter(([,v]) => v).map(([label, val], i) => (
                          <div key={i} className="td-spec-row">
                            <span className="sl">{label}</span>
                            <span className="sv">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* REVIEWS */}
                  <div className={`td-tab-panel${activeTab === 'rev' ? ' active' : ''}`}>
                    {/* Overall rating */}
                    <div className="td-reviews-top">
                      <div className="td-rev-left">
                        <div className="td-rev-big">{averageRating > 0 ? averageRating.toFixed(1) : '5.0'}</div>
                        <div className="td-rev-stars">★★★★★</div>
                        <div className="td-rev-count">{totalReviews} ratings</div>
                      </div>
                      <div className="td-rev-bars">
                        {ratingDist.map(({ star, pct, count }) => (
                          <div key={star} className="td-rev-bar">
                            <span className="lbl">{star}★</span>
                            <div className="bar"><div className="fill" style={{ width:`${pct}%` }} /></div>
                            <span>{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reviews header + write button */}
                    <div className="td-reviews-header">
                      <h2 style={{ fontSize:'20px', fontWeight:'700', display:'flex', alignItems:'center', gap:'8px' }}>
                        <FiMessageCircle style={{ color:'var(--primary)' }} />
                        Reviews ({totalReviews})
                      </h2>
                      {currentUser && (
                        <button className="td-btn-write-review" onClick={() => setShowReviewForm(!showReviewForm)}>
                          Write a Review
                        </button>
                      )}
                    </div>

                    {/* Review form */}
                    {showReviewForm && (
                      <div className="td-review-form-card">
                        <form onSubmit={handleReviewSubmit}>
                          <div className="td-form-group">
                            <label>Rating</label>
                            <div className="td-rating-input">
                              {[5,4,3,2,1].map(r => (
                                <button key={r} type="button" className="td-star-btn" onClick={() => setReviewForm({ ...reviewForm, rating: r })}>
                                  <FiStar style={{ color: r <= reviewForm.rating ? '#fbbf24' : '#d1d5db', fill: r <= reviewForm.rating ? '#fbbf24' : 'none', fontSize:'24px' }} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="td-form-group">
                            <label>Title (Optional)</label>
                            <input type="text" value={reviewForm.title} onChange={e => setReviewForm({ ...reviewForm, title: e.target.value })} placeholder="Review title" />
                          </div>
                          <div className="td-form-group">
                            <label>Your Review *</label>
                            <textarea value={reviewForm.review_text} onChange={e => setReviewForm({ ...reviewForm, review_text: e.target.value })} placeholder="Share your experience with this product..." rows={4} required />
                          </div>
                          <div className="td-form-actions">
                            <button type="button" className="td-btn-cancel" onClick={() => { setShowReviewForm(false); setReviewForm({ rating:5, title:'', review_text:'' }); }}>Cancel</button>
                            <button type="submit" className="td-btn-submit" disabled={submittingReview || !reviewForm.review_text.trim()}>{submittingReview ? 'Submitting…' : 'Submit Review'}</button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Reviews list */}
                    {reviews.length === 0 ? (
                      <div className="td-no-reviews">
                        <div style={{ color:'var(--border)' }}><svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
                        <p>No reviews yet. Be the first to review this product!</p>
                      </div>
                    ) : (
                      <>
                        <div>
                          {reviews.slice(0, displayedReviews).map(review => {
                            const isOwnReview = currentUser && review.user_id === currentUser.id;
                            const isEditing = editingReviewId === review.id;
                            return (
                              <div key={review.id} className="td-review-card">
                                <div className="td-review-header">
                                  <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1 }}>
                                    {review.user_photo
                                      ? <img src={review.user_photo} alt={review.user_name} className="td-reviewer-avatar" />
                                      : <div className="td-reviewer-avatar-placeholder"><FiUser /></div>
                                    }
                                    <div>
                                      <div className="td-reviewer-name">{review.user_name || 'Anonymous'}</div>
                                      <div className="td-review-date">{new Date(review.created_at).toLocaleDateString()}</div>
                                    </div>
                                  </div>
                                  <div className="td-review-rating" style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                                    {renderStars(review.rating)}
                                    <span style={{ marginLeft:'6px', fontWeight:'600', fontSize:'13px' }}>{review.rating}.0</span>
                                  </div>
                                  {isOwnReview && !isEditing && (
                                    <div style={{ display:'flex', gap:'6px', marginLeft:'12px' }}>
                                      <button className="td-btn-edit" onClick={() => handleEditClick(review)}>Edit</button>
                                      <button className="td-btn-delete" onClick={() => handleDeleteReview(review.id)} disabled={deletingReviewId === review.id}>
                                        {deletingReviewId === review.id ? 'Deleting…' : 'Delete'}
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {isEditing ? (
                                  <form onSubmit={handleEditSubmit} style={{ marginTop:'12px' }}>
                                    <div className="td-form-group">
                                      <label>Rating</label>
                                      <div className="td-rating-input">
                                        {[5,4,3,2,1].map(r => (
                                          <button key={r} type="button" className="td-star-btn" onClick={() => setEditForm({ ...editForm, rating: r })}>
                                            <FiStar style={{ color: r <= editForm.rating ? '#fbbf24' : '#d1d5db', fill: r <= editForm.rating ? '#fbbf24' : 'none', fontSize:'24px' }} />
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="td-form-group">
                                      <label>Title (Optional)</label>
                                      <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} placeholder="Review title" />
                                    </div>
                                    <div className="td-form-group">
                                      <label>Your Review *</label>
                                      <textarea value={editForm.review_text} onChange={e => setEditForm({ ...editForm, review_text: e.target.value })} rows={4} required />
                                    </div>
                                    <div className="td-form-actions">
                                      <button type="button" className="td-btn-cancel" onClick={() => setEditingReviewId(null)}>Cancel</button>
                                      <button type="submit" className="td-btn-submit" disabled={submittingReview || !editForm.review_text.trim()}>{submittingReview ? 'Saving…' : 'Save'}</button>
                                    </div>
                                  </form>
                                ) : (
                                  <>
                                    {review.title && <h4 className="td-review-title">{review.title}</h4>}
                                    <p className="td-review-text">{review.review_text}</p>
                                    {review.seller_reply && (
                                      <div className="td-seller-reply">
                                        <strong>Seller Reply:</strong>
                                        <p style={{ marginTop:'4px', fontSize:'14px', color:'#555' }}>{review.seller_reply}</p>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {displayedReviews < reviews.length && (
                          <div className="td-load-more">
                            <button onClick={() => setDisplayedReviews(displayedReviews + reviewsPerPage)}>
                              Load More Reviews ({displayedReviews} of {reviews.length})
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* CHANGELOG */}
                  <div className={`td-tab-panel${activeTab === 'cl' ? ' active' : ''}`}>
                    <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
                      {[
                        { v:'v1.2', title:'Version 1.2 — Performance Update', date:'May 5, 2026', isNew:true, items:['Improved page load speed by 35%','Added new product card variants','Refined dark mode color palette','Bug fixes and accessibility improvements'] },
                        { v:'v1.1', title:'Version 1.1 — RTL & Dark Mode', date:'Mar 12, 2026', items:['Added full RTL support','Introduced dark mode','New checkout layout'] },
                        { v:'v1.0', title:'Version 1.0 — Initial Release', date:'Jan 18, 2026', items:['Initial release','Complete homepage design','React components included','Documentation added'] },
                      ].map((cl, i, arr) => (
                        <div key={i} style={{ display:'flex', gap:'20px' }}>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                            <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'var(--primary)', color:'#fff', fontFamily:'Poppins, sans-serif', fontSize:'11px', fontWeight:'700', display:'grid', placeItems:'center', flexShrink:0 }}>{cl.v}</div>
                            {i < arr.length - 1 && <div style={{ width:'2px', flex:1, borderLeft:'2px dashed var(--border)', minHeight:'30px', marginTop:'4px' }} />}
                          </div>
                          <div style={{ flex:1, paddingBottom:'20px' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'8px' }}>
                              <div style={{ fontFamily:'Poppins, sans-serif', fontSize:'16px', fontWeight:'700' }}>{cl.title}</div>
                              <div style={{ fontSize:'12px', color:'#999' }}>{cl.date}</div>
                            </div>
                            {cl.isNew && <span style={{ display:'inline-block', background:'#dcfce7', color:'#16a34a', fontSize:'11px', fontWeight:'700', borderRadius:'20px', padding:'3px 10px', marginTop:'8px' }}>NEW</span>}
                            <ul style={{ marginTop:'10px', listStyle:'none', display:'flex', flexDirection:'column', gap:'6px' }}>
                              {cl.items.map((item, j) => (
                                <li key={j} style={{ fontSize:'14px', color:'#555', paddingLeft:'14px', position:'relative' }}>
                                  <span style={{ position:'absolute', left:0, color:'var(--primary)', fontWeight:'700' }}>•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FAQ */}
                  <div className={`td-tab-panel${activeTab === 'faq' ? ' active' : ''}`}>
                    <FaqAccordion />
                  </div>

                </div>
              </div>

              {/* RIGHT SIDEBAR */}
              <aside className="td-sidebar">
                <div className="td-purchase-card">
                  <div className="td-price-block">
                    <div>
                      <div className="td-price-main">₹{Number(tpl.price || 0).toLocaleString('en-IN')}</div>
                      <div className="td-price-sub">
                        {tpl.old_price && <span className="td-price-old">₹{Number(tpl.old_price).toLocaleString('en-IN')}</span>}
                        {discountPct && <span className="td-price-off">{discountPct}% OFF</span>}
                      </div>
                    </div>
                    <button className={`td-wishlist-btn${inWishlist ? ' active' : ''}`} onClick={toggleWishlist} disabled={wishlistLoading} aria-label="Add to wishlist">
                      <FiHeart style={{ fill: inWishlist ? 'var(--danger)' : 'none', color: inWishlist ? 'var(--danger)' : 'inherit' }} />
                    </button>
                  </div>

                  <div className="td-urgency">🔥 <span>12 people bought this week</span></div>

                  <div className="td-actions">
                    <button className={`td-btn td-btn-cart${cartAdded ? ' added' : ''}`} onClick={handleAddToCart}>
                      <FiShoppingCart /> {cartAdded ? '✓ Added to Cart!' : 'Add to Cart'}
                    </button>
                    {tpl.preview_url && (
                      <button className="td-btn td-btn-preview-act" onClick={() => window.open(tpl.preview_url, '_blank', 'noopener,noreferrer')}>
                        <FiEye /> Live Preview
                      </button>
                    )}
                  </div>

                  <div className="td-trust">
                    <div className="td-trust-item"><div className="ic">🔒</div><div className="lbl">Secure Checkout</div></div>
                    <div className="td-trust-item"><div className="ic">📦</div><div className="lbl">Instant Download</div></div>
                    <div className="td-trust-item"><div className="ic">🔄</div><div className="lbl">Money Back</div></div>
                  </div>

                  <div className="td-divider" />

                  <div className="td-quick-specs">
                    {tpl.category  && <div className="td-qs"><span className="l">Category</span><span className="v">{tpl.category}</span></div>}
                    {tpl.framework && <div className="td-qs"><span className="l">Framework</span><span className="v">{tpl.framework}</span></div>}
                    {tpl.layout    && <div className="td-qs"><span className="l">Layout</span><span className="v">{tpl.layout}</span></div>}
                    <div className="td-qs"><span className="l">Downloads</span><span className="v">{tpl.downloads}</span></div>
                  </div>

                  {tpl.tags && (
                    <>
                      <div className="td-divider" />
                      {typeof tpl.tags === 'string' && (
                      <div className="td-tags">
                        <span className="tl">Tags:</span>
                        {tpl.tags.split(',').map((tag, i) => (
                          <span key={i} className="td-tag">#{tag.trim()}</span>
                        ))}
                      </div>
                      )}
                    </>
                  )}
                </div>

                {/* Seller card */}
                <div className="td-seller-card">
                  <h3 className="td-section-title" style={{ fontSize:'14px' }}>Seller Info</h3>
                  <div className="td-seller-row">
                    <div className="td-seller-avatar">{authorInitial}</div>
                    <div className="td-seller-info">
                      <h4>{tpl.author}</h4>
                      <div className="td-seller-rating">★★★★★ <span className="num">4.8</span></div>
                      <div className="td-seller-meta">
                        <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V5l-8-3z"/></svg>
                        Verified Seller <span className="ms">· Member since 2023</span>
                      </div>
                    </div>
                  </div>
                  <div className="td-seller-stats">
                    <div className="td-seller-stat"><div className="v">15</div><span className="l">Templates</span></div>
                    <div className="td-seller-stat"><div className="v">4.8</div><span className="l">Rating</span></div>
                    <div className="td-seller-stat"><div className="v">230</div><span className="l">Total Sales</span></div>
                  </div>
                  {/* <div className="td-seller-btns">
                    <span className="td-sb-view" onClick={() => setShowTicketModal(true)}>View All Items</span>
                    <span className="td-sb-contact" onClick={() => setShowTicketModal(true)}>Contact</span>
                  </div> */}
                </div>

                {/* Compatible Browsers */}
                {tpl.compatible_browsers && (
                  <div className="td-browsers-card">
                    <h4>Compatible Browsers</h4>
                    <div className="td-browsers">
                      <div className="td-br c1" title="Chrome">C</div>
                      <div className="td-br c2" title="Firefox">F</div>
                      <div className="td-br c3" title="Safari">S</div>
                      <div className="td-br c4" title="Edge">E</div>
                      <div className="td-br c5" title="Opera">O</div>
                    </div>
                  </div>
                )}

              </aside>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}

/* ── FAQ Accordion (pure UI, no backend needed) ── */
function FaqAccordion() {
  const [open, setOpen] = useState(null);
  const faqs = [
    { q:"What's included in the download package?", a:"You'll receive all source files including HTML, CSS, JS, React components, Figma source, PSDs, font files and a detailed PDF documentation file." },
    { q:"Is this template beginner-friendly?", a:"Yes — the code is clean, well-commented, and the included documentation walks you through every customization step." },
    { q:"Can I use this for client projects?", a:"Absolutely. The standard license allows you to use this template for unlimited personal or client projects." },
    { q:"Do you provide support after purchase?", a:"Yes — every purchase includes 6 months of seller support, with extended support available as an add-on." },
    { q:"How do I get future updates?", a:"All updates are free for life. You'll get notified via email and can re-download the latest version any time from your dashboard." },
  ];
  return (
    <div>
      {faqs.map((f, i) => (
        <div key={i} style={{ borderBottom:'1px solid var(--border)' }}>
          <button onClick={() => setOpen(open === i ? null : i)} style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 0', cursor:'pointer', textAlign:'left', fontFamily:'Poppins, sans-serif', fontSize:'15px', fontWeight:'600', color:'var(--text-dark)', background:'none', border:'none' }}>
            {f.q}
            <span style={{ color:'var(--primary)', fontSize:'22px', transition:'transform .3s', transform: open === i ? 'rotate(45deg)' : 'none', flexShrink:0, marginLeft:'12px' }}>+</span>
          </button>
          <div style={{ maxHeight: open === i ? '200px' : '0', overflow:'hidden', transition:'max-height .3s ease' }}>
            <div style={{ padding:'0 0 16px', fontSize:'14px', color:'var(--text-muted)', lineHeight:1.7 }}>{f.a}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TemplateDetails;
