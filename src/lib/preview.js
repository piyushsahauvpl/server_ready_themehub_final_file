export function slugify(text) {
  if (!text) return '';
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}
 
export async function openPreviewForTemplate(tpl) {
  if (!tpl) return false;
 
  // Open a blank window immediately to avoid popup-blockers; we'll navigate it when we have a target
  const win = window.open('', '_blank');
  if (!win) {
    alert('Popup blocked: please allow popups for this site to use Live Preview.');
    return false;
  }
 
  // helper: skip obvious Windows filesystem paths like "C:\\..." which are not valid URLs
  const looksLikeWindowsPath = (s) => typeof s === 'string' && /^[A-Za-z]:\\/.test(s.trim());
 
  // Normalize URL building
  // When running the frontend dev server (localhost:3000) the static template files are served by Apache on http://localhost
  // so prefer that origin for resolving local template files when appropriate.
  const staticOrigin = (window.location.hostname === 'localhost' && window.location.port === '3000') ? 'https://uptulathemehub.com' : (window.location.protocol + '//' + window.location.host);
  const toFullUrl = (u) => {
    if (!u) return null;
    if (looksLikeWindowsPath(u)) return null;
    const s = String(u).trim();
    if (/^https?:\/\//i.test(s) || s.startsWith('//') || s.startsWith('/')) return s.startsWith('/') ? staticOrigin + s : s;
    return staticOrigin + '/' + s;
  };
 
  // 1) explicit preview URLs (skip Windows file paths)
  if (tpl.preview_url) {
    const full = toFullUrl(tpl.preview_url);
    if (full) {
      console.log('[preview] using preview_url:', full);
      win.location.href = full;
      return true;
    }
  }
  if (tpl.live_preview_url) {
    const full = toFullUrl(tpl.live_preview_url);
    if (full) {
      console.log('[preview] using live_preview_url:', full);
      win.location.href = full;
      return true;
    }
  }
 
  // Special-case: Old Age template — open its known index-mp-layout1.html directly
  try {
    const titleMatch = String(tpl.title || tpl.name || '').toLowerCase();
    if (tpl.id === 11 || /old\s*age/.test(titleMatch)) {
      const specialPath = `/uptula_theme_hub/Frontend/src/templates/${encodeURIComponent('old-age react')}/index-mp-layout1.html`;
      const specialUrl = staticOrigin + specialPath;
      console.log('[preview] navigating to', specialUrl);
      win.location.href = specialUrl;
      return true;
    }
  } catch (e) { /* ignore */ }
 
  // Check if this is an uploaded product (has file_url pointing to backend/uploads)
  const isUploadedProduct = tpl.file_url && String(tpl.file_url).includes('backend/uploads');
 
  // If it's an uploaded product, skip local templates and go straight to API
  if (isUploadedProduct && tpl.id) {
    const API_BASE = process.env.REACT_APP_API_URL || 'https://uptulathemehub.com/backend/api';
    const API = `${API_BASE}/preview.php`;
    console.log('[preview] Uploaded product detected, using backend API with id:', tpl.id);
    win.location.href = `${API}?id=${encodeURIComponent(tpl.id)}`;
    return true;
  }
 
  // 2) try local templates folder under Frontend/src/templates/<name>/<filename>
  const candidates = [];
  if (tpl.preview_local) candidates.push(String(tpl.preview_local));
  if (tpl.slug) candidates.push(String(tpl.slug));
  if (tpl.name) candidates.push(String(tpl.name));
  if (tpl.title) candidates.push(slugify(tpl.title));
  if (tpl.id) candidates.push(String(tpl.id));
 
  // Also try raw title (preserves spaces) and some slug variants
  if (tpl.title) {
    const raw = String(tpl.title).trim();
    candidates.push(raw);
    candidates.push(slugify(raw));
  }
 
  // Generate additional candidates from title words (e.g. "Old Age React" -> 'old-age', 'old-age-react', 'old age react')
  const titleSource = (tpl.title || tpl.name || '');
  const wordsFull = (String(titleSource).toLowerCase().match(/\b[a-z0-9]+\b/g) || []);
  for (let len = Math.min(4, wordsFull.length); len >= 1; len--) {
    const chunk = wordsFull.slice(0, len);
    if (chunk.length) {
      candidates.push(chunk.join(' '));
      candidates.push(chunk.join('-'));
    }
  }
 
  // Also try filtered (remove common stop words to generate shorter folder names)
  const stopWords = new Set(['template','templates','home','wordpress','theme','themes','mp','layout']);
  const filtered = wordsFull.filter(w => !stopWords.has(w));
  for (let len = filtered.length; len >= 1; len--) {
    const chunk = filtered.slice(0, len);
    if (chunk.length) {
      candidates.push(chunk.join(' '));
      candidates.push(chunk.join('-'));
    }
  }
 
  // Ensure 'safari' is checked as a last resort
  candidates.push('safari');
 
  // Try a few possible filenames inside each template folder (navigate directly)
  const filenames = ['index-mp-layout1.html', 'index.html', 'index-mp-layout.html'];
 
  for (const name of candidates) {
    if (!name) continue;
    for (const fname of filenames) {
      const path = `/uptula_theme_hub/Frontend/src/templates/${encodeURIComponent(name)}/${encodeURIComponent(fname)}`;
      const url = staticOrigin + path;
      // Navigate immediately and let the browser handle the result (faster, avoids async popup issues)
      console.log('[preview] trying candidate', url);
      win.location.href = url;
      return true;
    }
  }
 
  // 3) fallback to backend preview extractor if available
  const API_BASE = process.env.REACT_APP_API_URL || 'https://uptulathemehub.com/backend/api';
  const API = `${API_BASE}/preview.php`;
 
  // For uploaded products with file_url, use the backend API
  if (tpl.file_url && tpl.id) {
    console.log('[preview] using backend API with id:', tpl.id);
    win.location.href = `${API}?id=${encodeURIComponent(tpl.id)}`;
    return true;
  }
 
  if (tpl.id) {
    console.log('[preview] using backend API fallback with id:', tpl.id);
    win.location.href = `${API}?id=${encodeURIComponent(tpl.id)}`;
    return true;
  }
 
  // Nothing found — close the window and inform user
  try { win.close(); } catch (e) {}
  alert('No live preview available for this template.');
  return false;
}
 
 