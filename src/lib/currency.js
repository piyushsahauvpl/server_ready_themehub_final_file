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

/**
 * Legacy format price function (INR only)
 * Used as fallback when CurrencyContext is not available
 * 
 * @deprecated Use useCurrency().formatPrice() instead for multi-currency support
 * @param {number} value Price value
 * @returns {string} Formatted price with INR symbol
 */
export function formatPrice(value) {
  if (value == null) return `${DEFAULT_CURRENCY_SYMBOL}0`;
  
  // Parse value if it's a string
  const num = typeof value === 'number' 
    ? value 
    : parseFloat(String(value).replace(/[^0-9.\-]/g, '')) || 0;
  
  // Remove decimals for whole numbers, otherwise show two decimals
  const formatted = Number.isInteger(num) 
    ? num.toString() 
    : num.toFixed(2);
  
  return `${DEFAULT_CURRENCY_SYMBOL}${formatted}`;
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

