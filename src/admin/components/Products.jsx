import { useState, useEffect } from "react";
import MainLayout from "../components/MainLayout";
import { openPreviewForTemplate } from "../../lib/preview";
import {
  FiEdit, FiTrash2, FiChevronDown, FiChevronUp,
  FiInfo, FiExternalLink, FiMonitor, FiDownload
} from "react-icons/fi";

/* ─────────────────────────────────────────
   TOOLTIP COMPONENT
───────────────────────────────────────── */
function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   ACTION BUTTON
───────────────────────────────────────── */
const colorMap = {
  gray:   "bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-500 hover:text-gray-800",
  sky:    "bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-600 hover:text-sky-700",
  indigo: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-600 hover:text-indigo-700",
  amber:  "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-600 hover:text-amber-700",
  red:    "bg-red-50 hover:bg-red-100 border-red-200 text-red-500 hover:text-red-600",
  green:  "bg-green-50 hover:bg-green-100 border-green-200 text-green-600 hover:text-green-700",
  teal:   "bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-600 hover:text-teal-700",
};

function ActionBtn({ tooltip, color = "gray", onClick, children, disabled = false }) {
  return (
    <Tooltip text={tooltip}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed ${colorMap[color]}`}
      >
        {children}
      </button>
    </Tooltip>
  );
}

function ActionLink({ tooltip, color = "gray", href, children }) {
  return (
    <Tooltip text={tooltip}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-150 ${colorMap[color]}`}
      >
        {children}
      </a>
    </Tooltip>
  );
}

function ActionDivider() {
  return <div className="w-px h-5 bg-gray-200 mx-0.5 flex-shrink-0" />;
}

/* ─────────────────────────────────────────
   META CARD
───────────────────────────────────────── */
function MetaCard({ label, children }) {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</p>
      <div className="text-sm font-semibold text-gray-800">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function Products() {
  const [products, setProducts]                     = useState([]);
  const [categories, setCategories]                 = useState([]);
  const [frameworks, setFrameworks]                 = useState([]);
  const [search, setSearch]                         = useState("");
  const [categoryFilter, setCategoryFilter]         = useState("");
  const [frameworkFilter, setFrameworkFilter]       = useState("");
  const [selectedProduct, setSelectedProduct]       = useState(null);
  const [deleteId, setDeleteId]                     = useState(null);
  const [detailProduct, setDetailProduct]           = useState(null);
  const [expandedProductId, setExpandedProductId]   = useState(null);
  const [currentPage, setCurrentPage]               = useState(1);
  const itemsPerPage = 5;

  const API_URL       = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
  const ADMIN_API_URL = `${API_URL}/admin`;

  /* LOAD CATEGORIES */
  useEffect(() => {
    fetch(`${ADMIN_API_URL}/categories.php?type=category`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success && d.categories) setCategories(d.categories); })
      .catch(e => console.error('Categories fetch error', e));
  }, []);

  /* LOAD FRAMEWORKS */
  useEffect(() => {
    fetch(`${ADMIN_API_URL}/categories.php?type=framework`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success && d.frameworks) setFrameworks(d.frameworks); })
      .catch(e => console.error('Frameworks fetch error', e));
  }, []);

  /* LOAD PRODUCTS */
  useEffect(() => {
    fetch(`${ADMIN_API_URL}/products.php`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success && d.products) setProducts(d.products); })
      .catch(e => console.error('Products fetch error', e));
  }, []);

  /* HELPERS */
  const resolveUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const p = url.startsWith('/') ? url : `/${url}`;
    return `https://uptulathemehub.com${p}`;
  };

  const handleDownload = (p) => {
    const fileUrl = resolveUrl(p.file_url);
    if (!fileUrl) return;
    fetch(fileUrl)
      .then(r => r.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = p.file_url.split('/').pop() || 'download.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch(() => alert('Error downloading file'));
  };

  /* FILTER + SEARCH */
  const filtered = products.filter(p => {
    const t = search.toLowerCase();
    return (
      ((p.name || '').toLowerCase().includes(t) ||
       (p.category_name || '').toLowerCase().includes(t) ||
       (p.framework_name || '').toLowerCase().includes(t)) &&
      (!categoryFilter  || p.category_name  === categoryFilter) &&
      (!frameworkFilter || p.framework_name === frameworkFilter)
    );
  });

  const totalPages      = Math.ceil(filtered.length / itemsPerPage);
  const visibleProducts = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  /* SAVE EDIT */
  const saveEdit = () => {
    const updated = products.map(p => p.id === selectedProduct.id ? selectedProduct : p);
    setProducts(updated);
    localStorage.setItem("products", JSON.stringify(updated));
    setSelectedProduct(null);
  };

  /* DELETE */
  const confirmDelete = async () => {
    try {
      const res  = await fetch(`${ADMIN_API_URL}/products.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: deleteId })
      });
      const data = await res.json();
      if (data.success) {
        setProducts(products.filter(p => p.id !== deleteId));
        setDeleteId(null);
      } else {
        alert('Error: ' + (data.message || 'Failed to delete'));
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting product');
    }
  };

  /* ══════════════════════════════════════
     RENDER
  ══════════════════════════════════════ */
  return (
    <MainLayout>

      {/* PAGE HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Product Overview</h2>
          <p className="text-gray-500 mt-1">Manage your product catalog</p>
        </div>
        <button
          onClick={() => (window.location.href = "/admin/add-product")}
          className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {/* SEARCH + FILTERS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-4 flex-wrap items-center">
          <div className="flex-1 min-w-[250px] relative">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pl-10 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            />
            <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <select
            className="border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition"
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>

          <select
            className="border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition"
            value={frameworkFilter}
            onChange={e => { setFrameworkFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Frameworks</option>
            {frameworks.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
          </select>

          {(search || categoryFilter || frameworkFilter) && (
            <button
              onClick={() => { setSearch(''); setCategoryFilter(''); setFrameworkFilter(''); setCurrentPage(1); }}
              className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Clear Filters
            </button>
          )}
        </div>
        <p className="mt-3 text-sm text-gray-500">
          Showing <span className="font-medium text-gray-700">{visibleProducts.length}</span> of{" "}
          <span className="font-medium text-gray-700">{filtered.length}</span> products
        </p>
      </div>

      {/* TABLE */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center w-10">#</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">Thumb</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[180px]">Product</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Framework</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Offer</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center min-w-[280px]">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {visibleProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-base font-semibold text-gray-600">No products found</p>
                      <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleProducts.map((p, idx) => (
                  <>
                    <tr key={p.id || idx} className="hover:bg-gray-50/70 transition-colors duration-150">

                      {/* # */}
                      <td className="px-4 py-3.5 text-sm font-medium text-gray-400 text-center">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>

                      {/* THUMBNAIL */}
                      <td className="px-4 py-3.5">
                        {p.image_url ? (
                          <img
                            src={resolveUrl(p.image_url) || 'https://via.placeholder.com/56x40?text=N/A'}
                            alt={p.name || p.title}
                            className="w-14 h-10 object-cover rounded-lg border border-gray-200 shadow-sm"
                            onError={e => { e.target.src = 'https://via.placeholder.com/56x40?text=N/A'; }}
                          />
                        ) : (
                          <div className="w-14 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </td>

                      {/* NAME */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-gray-900 truncate max-w-[200px]">{p.name || p.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{p.slug || ''}</p>
                      </td>

                      {/* CATEGORY */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                          {p.category_name || '—'}
                        </span>
                      </td>

                      {/* FRAMEWORK */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="px-2.5 py-1 text-xs font-medium bg-purple-50 text-purple-700 rounded-full border border-purple-100">
                          {p.framework_name || '—'}
                        </span>
                      </td>

                      {/* PRICE */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">₹{p.price || 0}</span>
                      </td>

                      {/* OFFER */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {p.offer_price
                          ? <span className="text-sm font-semibold text-green-600">₹{p.offer_price}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>

                      {/* CREATED */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                      </td>

                      {/* ════════════════════════════════════
                           ACTIONS
                           ─────────────────────────────────
                           [ℹ]  │  [🖥][↗]  │  [⬇]  │  [✏][🗑]  │  [▼]
                           Info │  Preview   │  DL   │  Manage   │  Meta
                          ════════════════════════════════════ */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">

                          {/* ── INFO: opens detail modal ── */}
                          <ActionBtn
                            tooltip="View Details (modal)"
                            color="gray"
                            onClick={e => { e.stopPropagation(); setDetailProduct(p); }}
                          >
                            <FiInfo size={13} />
                          </ActionBtn>

                          <ActionDivider />

                          {/* ── PREVIEW TEMPLATE: in-app preview via openPreviewForTemplate ── */}
                          <ActionBtn
                            tooltip="Preview Template (in-app)"
                            color="indigo"
                            onClick={e => { e.stopPropagation(); openPreviewForTemplate(p); }}
                            disabled={!p.preview_url && !p.file_url}
                          >
                            <FiMonitor size={13} />
                          </ActionBtn>

                          {/* ── LIVE PREVIEW: opens raw URL in new browser tab ── */}
                          {p.preview_url ? (
                            <ActionLink
                              tooltip="Open Live Preview (new tab)"
                              color="sky"
                              href={resolveUrl(p.preview_url)}
                            >
                              <FiExternalLink size={13} />
                            </ActionLink>
                          ) : (
                            <ActionBtn tooltip="No live preview URL" color="sky" disabled>
                              <FiExternalLink size={13} />
                            </ActionBtn>
                          )}

                          <ActionDivider />

                          {/* ── DOWNLOAD FILE ── */}
                          <ActionBtn
                            tooltip={p.file_url ? "Download File (.zip)" : "No file available"}
                            color="teal"
                            onClick={e => { e.stopPropagation(); handleDownload(p); }}
                            disabled={!p.file_url}
                          >
                            <FiDownload size={13} />
                          </ActionBtn>

                          <ActionDivider />

                          {/* ── EDIT ── */}
                          <ActionBtn
                            tooltip="Edit Product"
                            color="amber"
                            onClick={e => { e.stopPropagation(); window.location.href = '/admin/add-product?id=' + (p.id || ''); }}
                          >
                            <FiEdit size={13} />
                          </ActionBtn>

                          {/* ── DELETE ── */}
                          <ActionBtn
                            tooltip="Delete Product"
                            color="red"
                            onClick={e => { e.stopPropagation(); setDeleteId(p.id); }}
                          >
                            <FiTrash2 size={13} />
                          </ActionBtn>

                          <ActionDivider />

                          {/* ── EXPAND METADATA ── */}
                          <ActionBtn
                            tooltip={expandedProductId === p.id ? "Hide Metadata" : "Show Metadata"}
                            color="green"
                            onClick={e => { e.stopPropagation(); setExpandedProductId(expandedProductId === p.id ? null : p.id); }}
                          >
                            {expandedProductId === p.id ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
                          </ActionBtn>

                        </div>
                      </td>
                    </tr>

                    {/* EXPANDED METADATA ROW */}
                    {expandedProductId === p.id && (
                      <tr className="bg-gradient-to-r from-green-50 to-blue-50 border-t-2 border-green-200">
                        <td colSpan="9" className="px-6 py-6">
                          <div className="space-y-4">
                            <p className="font-semibold text-gray-800">Product Metadata</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              <MetaCard label="Last Update">
                                {p.last_update && p.last_update !== '0000-00-00'
                                  ? new Date(p.last_update).toLocaleDateString()
                                  : 'N/A'}
                              </MetaCard>
                              <MetaCard label="High Resolution">
                                {Number(p.high_resolution) === 1
                                  ? <span className="text-green-600">✓ Yes</span>
                                  : <span className="text-gray-400">✗ No</span>}
                              </MetaCard>
                              <MetaCard label="Documentation">{p.documentation || 'N/A'}</MetaCard>
                              <MetaCard label="Layout">{p.layout || 'N/A'}</MetaCard>
                            </div>
                            {p.compatible_browsers && <MetaCard label="Compatible Browsers">{p.compatible_browsers}</MetaCard>}
                            {p.compatible_with      && <MetaCard label="Compatible With">{p.compatible_with}</MetaCard>}
                            {p.themeforest_files_included && <MetaCard label="ThemeForest Files Included">{p.themeforest_files_included}</MetaCard>}
                            {p.tags && (
                              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Tags</p>
                                <div className="flex flex-wrap gap-2">
                                  {p.tags.split(',').map((tag, i) => (
                                    <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                      {tag.trim()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page <span className="font-semibold">{currentPage}</span> of{" "}
              <span className="font-semibold">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════
           EDIT MODAL (price)
      ══════════════════════════════════ */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
            <h3 className="font-bold text-lg mb-4">Edit Price</h3>
            <input
              type="number"
              className="border border-gray-300 p-2.5 rounded-lg w-full mb-4 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={selectedProduct.price}
              onChange={e => setSelectedProduct({ ...selectedProduct, price: Number(e.target.value) })}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
           DELETE MODAL
      ══════════════════════════════════ */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-80 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FiTrash2 className="text-red-600" size={18} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Delete Product?</p>
                <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
           DETAILS MODAL
      ══════════════════════════════════ */}
      {detailProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{detailProduct.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Product Details</p>
                </div>
                <button
                  onClick={() => setDetailProduct(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {detailProduct.image_url && (
                <img
                  src={resolveUrl(detailProduct.image_url)}
                  alt={detailProduct.name}
                  className="w-full h-64 object-cover rounded-xl"
                  onError={e => { e.target.src = 'https://via.placeholder.com/800x400?text=No+Image'; }}
                />
              )}

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600 leading-relaxed">{detailProduct.description || 'No description provided'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Category</p><p className="font-semibold text-gray-800">{detailProduct.category_name || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Framework</p><p className="font-semibold text-gray-800">{detailProduct.framework_name || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Price</p><p className="font-bold text-green-600 text-lg">₹{parseFloat(detailProduct.price || 0).toFixed(2)}</p></div>
                <div><p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Offer Price</p><p className="font-semibold text-gray-800">{detailProduct.offer_price ? '₹' + parseFloat(detailProduct.offer_price).toFixed(2) : 'N/A'}</p></div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Product Metadata</h4>
                <div className="grid grid-cols-2 gap-4">
                  {detailProduct.last_update && detailProduct.last_update !== '0000-00-00' && (
                    <div><p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Update</p><p className="font-medium">{new Date(detailProduct.last_update).toLocaleDateString()}</p></div>
                  )}
                  <div><p className="text-xs text-gray-500 uppercase tracking-wide mb-1">High Resolution</p><p className="font-medium">{Number(detailProduct.high_resolution) === 1 ? '✓ Yes' : '✗ No'}</p></div>
                  {detailProduct.compatible_browsers && <div><p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Compatible Browsers</p><p className="font-medium">{detailProduct.compatible_browsers}</p></div>}
                  {detailProduct.compatible_with     && <div><p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Compatible With</p><p className="font-medium">{detailProduct.compatible_with}</p></div>}
                  {detailProduct.themeforest_files_included && <div><p className="text-xs text-gray-500 uppercase tracking-wide mb-1">ThemeForest Files</p><p className="font-medium">{detailProduct.themeforest_files_included}</p></div>}
                  {detailProduct.documentation && <div><p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Documentation</p><p className="font-medium">{detailProduct.documentation}</p></div>}
                  {detailProduct.layout         && <div><p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Layout</p><p className="font-medium">{detailProduct.layout}</p></div>}
                  {detailProduct.tags && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {detailProduct.tags.split(',').map((tag, i) => (
                          <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{tag.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-6 flex gap-3">
                <button
                  onClick={() => { setDetailProduct(null); window.location.href = '/admin/add-product?id=' + (detailProduct.id || ''); }}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-semibold"
                >
                  Edit Product
                </button>
                <button
                  onClick={() => setDetailProduct(null)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-semibold text-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
}