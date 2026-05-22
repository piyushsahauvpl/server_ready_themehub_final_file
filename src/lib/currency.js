/**
 * ============================================================================
 * CURRENCY FORMATTING - Multi-Currency Support
 * ============================================================================
 * 
 * Provides currency formatting functions for display
 * Supports both default INR and multi-currency conversion
 * 
 * For use in components that don't have access to CurrencyContext:
 * import { formatPrice } from '../lib/currency';
 * 
 * For components with CurrencyContext access:
 * import { useCurrency } from '../contexts/CurrencyContext';
 * const { formatPrice } = useCurrency();
 * ============================================================================
 */

// Default currency (fallback)
export const DEFAULT_CURRENCY_SYMBOL = '₹';
export const DEFAULT_CURRENCY_CODE = 'INR';

export const FALLBACK_CURRENCY_SYMBOLS = {
  INR: '\u20B9',
  USD: '$',
  EUR: '\u20AC',
  GBP: '\u00A3',
  CAD: 'C$',
  AUD: 'A$',
  NZD: 'NZ$',
  SGD: 'S$',
  JPY: '\u00A5',
};

export function getCurrencySymbol(code = DEFAULT_CURRENCY_CODE, fallback = DEFAULT_CURRENCY_SYMBOL) {
  return FALLBACK_CURRENCY_SYMBOLS[String(code || '').toUpperCase()] || fallback || DEFAULT_CURRENCY_SYMBOL;
}

/**
 * Legacy format price function (INR only)
 * Used as fallback when CurrencyContext is not available
 * 
 * @deprecated Use useCurrency().formatPrice() instead for multi-currency support
 * @param {number} value Price value
 * @returns {string} Formatted price with INR symbol
 */
export function formatCurrency(value, symbol = DEFAULT_CURRENCY_SYMBOL, currency = DEFAULT_CURRENCY_CODE) {
  if (value == null) return `${symbol || DEFAULT_CURRENCY_SYMBOL}0`;
  
  // Parse value if it's a string
  const num = typeof value === 'number' 
    ? value 
    : parseFloat(String(value).replace(/[^0-9.\-]/g, '')) || 0;
  
  const formatted = num.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  
  return `${symbol || DEFAULT_CURRENCY_SYMBOL}${formatted}`;
}

export function formatPrice(value) {
  return formatCurrency(value, DEFAULT_CURRENCY_SYMBOL, DEFAULT_CURRENCY_CODE);
}

/**
 * Format price with custom symbol and currency
 * 
 * @param {number} value Price value
 * @param {string} symbol Currency symbol (default: '₹')
 * @param {number} decimals Decimal places (default: 2)
 * @returns {string} Formatted price
 */
export function formatPriceWithSymbol(value, symbol = DEFAULT_CURRENCY_SYMBOL, decimals = 2) {
  if (value == null) return `${symbol}0`;
  
  const num = typeof value === 'number' 
    ? value 
    : parseFloat(String(value).replace(/[^0-9.\-]/g, '')) || 0;
  
  const formatted = decimals === 0 
    ? Math.round(num).toString() 
    : num.toFixed(decimals);
  
  return `${symbol}${formatted}`;
}

export function getINRPrice(item = {}) {
  return Number(
    item.price_inr ??
      item.original_price ??
      item.price ??
      item.offer_price_inr ??
      item.regular_price ??
      0
  ) || 0;
}

export function getDisplayPrice(item = {}, convertPrice = (value) => value, currency = item.currency) {
  // Try to use API-provided converted price first (most accurate, backend already did the math)
  const converted = item.converted_price ?? item.price_converted;
  const itemCurrency = item.currency || item.currency_code;
  
  // Use API converted price if:
  // 1. It exists and is a valid number
  // 2. AND either: no target currency specified OR currencies match
  if (
    converted !== undefined &&
    converted !== null &&
    converted !== '' &&
    (
      !currency || 
      !itemCurrency || 
      String(itemCurrency).toUpperCase() === String(currency).toUpperCase()
    )
  ) {
    const parsed = Number(converted);
    if (Number.isFinite(parsed) && parsed > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[getDisplayPrice] Using API converted_price:', { parsed, currency, itemCurrency });
      }
      return parsed;
    }
  }

  // Fallback: use convertPrice function with INR price
  const inrPrice = getINRPrice(item);
  const result = convertPrice(inrPrice);
  if (process.env.NODE_ENV === 'development') {
    console.log('[getDisplayPrice] Using convertPrice function:', { inrPrice, result, currency });
  }
  return result;
}

export function formatDisplayPrice(item = {}, currencyContext = {}) {
  // Determine target currency code
  const code = currencyContext.currency || item.currency || DEFAULT_CURRENCY_CODE;
  
  // Try to get symbol from multiple sources in order of preference:
  // 1. API response (most accurate, backend knows the exact currency)
  // 2. Context (may be INR by default)
  // 3. Currency helper function
  let symbol;
  
  // Check if item has currency_symbol from API
  if (item.currency_symbol) {
    symbol = item.currency_symbol;
    if (process.env.NODE_ENV === 'development') {
      console.log('[formatDisplayPrice] Using API currency_symbol:', symbol);
    }
  } else {
    // Fall back to context symbol or look it up
    symbol = currencyContext.symbol || getCurrencySymbol(code);
    if (process.env.NODE_ENV === 'development') {
      console.log('[formatDisplayPrice] Using context/lookup symbol:', symbol);
    }
  }
  
  // Get convertPrice function (has fallback that just returns value unchanged)
  const convertPrice = currencyContext.convertPrice || ((value) => value);
  
  // Calculate display price
  const displayPrice = getDisplayPrice(item, convertPrice, code);
  
  // Format with the determined symbol
  const formatted = formatCurrency(displayPrice, symbol, code);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[formatDisplayPrice] Final result:', { formatted, displayPrice, symbol, code });
  }
  
  return formatted;
}

export function createCartItem(item = {}) {
  const priceINR = getINRPrice(item);
  return {
    id: item.id ?? item.product_id,
    title: item.title || item.name || item.product_name,
    name: item.name || item.title || item.product_name,
    price: priceINR,
    price_inr: priceINR,
    image: item.image || item.image_url,
    image_url: item.image_url || item.image,
    slug: item.slug,
    author: item.author || item.seller_name,
  };
}

/**
 * Parse formatted price string back to number
 * 
 * @param {string} formattedPrice Formatted price (e.g., "₹1,199.99")
 * @returns {number} Parsed price value
 */
export function parsePriceString(formattedPrice) {
  if (!formattedPrice) return 0;
  
  // Remove all non-numeric characters except decimal point
  const cleaned = String(formattedPrice).replace(/[^0-9.\-]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Format price with thousand separators
 * 
 * @param {number} value Price value
 * @param {string} symbol Currency symbol
 * @param {number} decimals Decimal places
 * @returns {string} Formatted price with separators (e.g., "$ 1,234.56")
 */
export function formatPriceWithSeparators(
  value, 
  symbol = DEFAULT_CURRENCY_SYMBOL, 
  decimals = 2
) {
  if (value == null) return `${symbol}0`;
  
  const num = typeof value === 'number' 
    ? value 
    : parseFloat(String(value).replace(/[^0-9.\-]/g, '')) || 0;
  
  const formatted = decimals === 0 
    ? Math.round(num).toLocaleString() 
    : num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
  
  return `${symbol} ${formatted}`;
}

/**
 * Get currency info from browser localStorage
 * This is populated by CurrencyContext
 * 
 * @returns {object} Currency info {code, symbol, country}
 */
export function getCurrentCurrencyFromStorage() {
  try {
    const cached = localStorage.getItem('currentCurrency');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn('Error reading currency from localStorage:', e);
  }
  
  return {
    code: DEFAULT_CURRENCY_CODE,
    symbol: DEFAULT_CURRENCY_SYMBOL,
    country: 'IN'
  };
}

/**
 * Get exchange rates from browser localStorage
 * 
 * @returns {object} Exchange rates {CURRENCY: rate, ...}
 */
export function getExchangeRatesFromStorage() {
  try {
    const cached = localStorage.getItem('exchangeRates');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn('Error reading exchange rates from localStorage:', e);
  }
  
  return { INR: 1 };
}

/**
 * Convert price using rates from storage
 * Used in server-side rendering or components without context
 * 
 * @param {number} priceINR Price in INR
 * @param {string} targetCurrency Target currency code
 * @returns {number} Converted price
 */
export function convertPriceFromStorage(priceINR, targetCurrency = 'INR') {
  if (!priceINR || typeof priceINR !== 'number') return 0;
  
  if (targetCurrency === 'INR') return Math.round(priceINR * 100) / 100;
  
  const rates = getExchangeRatesFromStorage();
  const rate = rates[targetCurrency];
  
  if (!rate || rate <= 0) return Math.round(priceINR * 100) / 100;
  
  const converted = priceINR * rate;
  return Math.round(converted * 100) / 100;
}

/**
 * Check if currency is loaded
 * Useful for conditional rendering
 * 
 * @returns {boolean} True if currency data is available
 */
export function isCurrencyLoaded() {
  const currency = getCurrentCurrencyFromStorage();
  return currency.code !== DEFAULT_CURRENCY_CODE || 
         localStorage.getItem('exchangeRatesTimestamp') !== null;
}

