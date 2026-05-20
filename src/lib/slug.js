/**
 * Utility functions for generating and working with URL slugs
 */

/**
 * Generate a URL-friendly slug from a string
 * @param {string} text - The text to convert to a slug
 * @returns {string} - The generated slug
 */
export function generateSlug(text) {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/\s+/g, '-')
    .replace(/_/g, '-')
    // Remove special characters except hyphens
    .replace(/[^\w\-]+/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/\-\-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Get the slug from a product/template object
 * Uses existing slug if available, otherwise generates from name/title
 * @param {object} item - Product/template object
 * @returns {string} - The slug
 */
export function getSlug(item) {
  if (!item) return '';
  
  // Use existing slug if available
  if (item.slug) {
    return item.slug;
  }
  
  // Generate from name or title
  const name = item.name || item.title || '';
  if (name) {
    return generateSlug(name);
  }
  
  // Fallback to ID if no name available
  return item.id ? String(item.id) : '';
}

/**
 * Get the URL path for a template/product
 * @param {object} item - Product/template object
 * @returns {string} - The URL path
 */
export function getTemplateUrl(item) {
  const slug = getSlug(item);
  return `/template/${slug}`;
}
