# MULTI-CURRENCY IMPLEMENTATION - COMPLETE GUIDE & REAL-WORLD EXAMPLES

## TABLE OF CONTENTS

1. [Quick Start](#quick-start)
2. [Real-World Examples](#real-world-examples)
3. [Advanced Features](#advanced-features)
4. [Troubleshooting](#troubleshooting)
5. [Testing Guide](#testing-guide)
6. [Production Checklist](#production-checklist)

---

## QUICK START

### Step 1: Application Structure (Already Done)
Files created:
- ✅ `/backend/helpers/currency-helper.php` - Core functions
- ✅ `/backend/config/currency-config.php` - Configuration
- ✅ `/backend/api/currency.php` - Currency API endpoint
- ✅ `/src/contexts/CurrencyContext.jsx` - React context
- ✅ `/src/lib/currency.js` - Enhanced utilities
- ✅ Updated `/src/App.jsx` - Wrapped with CurrencyProvider
- ✅ Updated `/backend/api/products.php` - Returns currency data
- ✅ Updated `/src/components/TemplateCard.jsx` - Uses currency context

### Step 2: Testing the Setup

1. **Verify Backend API:**
```bash
# Check currency detection
curl "http://localhost/backend/api/currency.php?action=get-currency"

# Check conversion
curl "http://localhost/backend/api/currency.php?action=convert-price&price=1199&currency=USD"

# Check cache status
curl "http://localhost/backend/api/currency.php?action=cache-status"
```

2. **Check Products API:**
```bash
# Should now include currency info
curl "http://localhost/backend/api/products.php?limit=5"

# Response includes:
# {
#   "success": true,
#   "data": [...products...],
#   "currency": {
#     "code": "USD",
#     "symbol": "$",
#     "country": "US"
#   }
# }
```

3. **Test in Browser:**
- Open DevTools → Network tab
- Refresh page
- Check `/backend/api/currency.php` response
- Should show detected country and currency

---

## REAL-WORLD EXAMPLES

### Example 1: Using CurrencyContext in Components

**For components that need currency:**

```jsx
import { useCurrency } from '../contexts/CurrencyContext';

export function PriceDisplay({ priceINR }) {
  const { formatPrice, convertPrice } = useCurrency();
  
  // Method 1: Convert then format
  const converted = convertPrice(priceINR);
  const display = formatPrice(converted);
  
  return <div className="price">{display}</div>;
}

// Alternative - single step
export function SimplePriceDisplay({ priceINR }) {
  const { formatPrice, convertPrice } = useCurrency();
  
  return (
    <div>
      {formatPrice(convertPrice(priceINR))}
    </div>
  );
}
```

### Example 2: Product Card Component

**Complete example (already implemented in TemplateCard.jsx):**

```jsx
import { useCurrency } from '../contexts/CurrencyContext';

export function ProductCard({ product }) {
  const { formatPrice, convertPrice } = useCurrency();
  
  // Get original INR price
  const priceINR = product.price_inr || product.price;
  
  // Convert and format
  const displayPrice = formatPrice(convertPrice(priceINR));
  
  return (
    <div className="product-card">
      <h3>{product.title}</h3>
      <p>{displayPrice}</p>
      <button>Buy Now</button>
    </div>
  );
}
```

### Example 3: Cart with Multiple Currencies

```jsx
import { useCurrency } from '../contexts/CurrencyContext';

export function CartSummary({ items }) {
  const { convertPrice, formatPrice } = useCurrency();
  
  // Calculate total in INR first
  const totalINR = items.reduce((sum, item) => {
    return sum + (item.price_inr * item.quantity);
  }, 0);
  
  // Convert to current currency
  const totalConverted = convertPrice(totalINR);
  
  // Calculate item totals
  const itemTotals = items.map(item => ({
    ...item,
    total: formatPrice(convertPrice(item.price_inr * item.quantity))
  }));
  
  return (
    <div>
      {itemTotals.map(item => (
        <div key={item.id}>
          <span>{item.title}</span>
          <span>{item.total}</span>
        </div>
      ))}
      <hr />
      <strong>Total: {formatPrice(totalConverted)}</strong>
    </div>
  );
}
```

### Example 4: Currency Switcher Component

```jsx
import { useCurrency } from '../contexts/CurrencyContext';

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  
  const currencies = [
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'EUR', name: 'Euro' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' }
  ];
  
  return (
    <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
      {currencies.map(curr => (
        <option key={curr.code} value={curr.code}>
          {curr.code} - {curr.name}
        </option>
      ))}
    </select>
  );
}
```

### Example 5: Price Range Display

```jsx
import { useCurrency } from '../contexts/CurrencyContext';

export function PriceRange({ minINR, maxINR }) {
  const { formatPrice, convertPrice } = useCurrency();
  
  const minConverted = convertPrice(minINR);
  const maxConverted = convertPrice(maxINR);
  
  return (
    <span className="price-range">
      {formatPrice(minConverted)} - {formatPrice(maxConverted)}
    </span>
  );
}
```

### Example 6: Using Currency API Directly

```javascript
// For advanced cases where you need raw API data

async function getConvertedPrice(priceINR, currency = 'USD') {
  try {
    const response = await fetch(
      `/backend/api/currency.php?action=convert-price&price=${priceINR}&currency=${currency}`
    );
    
    const data = await response.json();
    
    if (data.success) {
      return {
        original: data.data.price_inr,
        converted: data.data.price_converted,
        currency: data.data.currency,
        symbol: data.data.symbol
      };
    }
  } catch (error) {
    console.error('Conversion error:', error);
    return null;
  }
}

// Usage
const priceData = await getConvertedPrice(1199, 'USD');
console.log(`${priceData.symbol}${priceData.converted}`); // $14.38
```

### Example 7: Batch Price Conversion

```jsx
import { useCurrency } from '../contexts/CurrencyContext';

export function ProductList({ products }) {
  const { convertPrice, formatPrice } = useCurrency();
  
  return (
    <ul>
      {products.map(product => (
        <li key={product.id}>
          <h4>{product.name}</h4>
          <p>
            {formatPrice(
              convertPrice(product.price_inr || product.price)
            )}
          </p>
        </li>
      ))}
    </ul>
  );
}
```

### Example 8: With Loading State

```jsx
import { useCurrency } from '../contexts/CurrencyContext';

export function PriceWithLoader({ priceINR }) {
  const { formatPrice, convertPrice, loading } = useCurrency();
  
  if (loading) {
    return <div className="price">Loading...</div>;
  }
  
  return (
    <div className="price">
      {formatPrice(convertPrice(priceINR))}
    </div>
  );
}
```

### Example 9: Currency Display with Country Flag

```jsx
import { useCurrency } from '../contexts/CurrencyContext';

const countryFlags = {
  IN: '🇮🇳',
  US: '🇺🇸',
  GB: '🇬🇧',
  DE: '🇩🇪',
  FR: '🇫🇷',
  CA: '🇨🇦',
  AU: '🇦🇺',
};

export function CurrencyWithFlag() {
  const { currency, country, symbol } = useCurrency();
  
  const flag = countryFlags[country] || '🌐';
  
  return (
    <div>
      <span>{flag} {currency}</span>
      <span>{symbol}</span>
    </div>
  );
}
```

### Example 10: Error Handling

```jsx
import { useCurrency } from '../contexts/CurrencyContext';

export function RobustPriceDisplay({ priceINR }) {
  const { formatPrice, convertPrice, error, currency } = useCurrency();
  
  if (error) {
    console.warn('Currency error:', error);
    // Fallback to INR
    return <span>₹{priceINR}</span>;
  }
  
  try {
    const converted = convertPrice(priceINR);
    return <span>{formatPrice(converted)}</span>;
  } catch (err) {
    console.error('Display error:', err);
    return <span>Price unavailable</span>;
  }
}
```

---

## ADVANCED FEATURES

### Feature 1: Currency Switcher with Persistence

**Component with localStorage persistence:**

```jsx
import { useState, useEffect } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';

export function AdvancedCurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  const [saved, setSaved] = useState(false);
  
  const handleChange = async (newCurrency) => {
    await setCurrency(newCurrency);
    setSaved(true);
    
    // Show confirmation
    setTimeout(() => setSaved(false), 2000);
  };
  
  return (
    <div className="currency-switcher">
      <select value={currency} onChange={(e) => handleChange(e.target.value)}>
        <option value="INR">₹ INR</option>
        <option value="USD">$ USD</option>
        <option value="GBP">£ GBP</option>
        <option value="EUR">€ EUR</option>
        <option value="CAD">C$ CAD</option>
        <option value="AUD">A$ AUD</option>
      </select>
      {saved && <span className="saved">✓ Saved</span>}
    </div>
  );
}
```

### Feature 2: Price Comparison (INR vs Current)

```jsx
import { useCurrency } from '../contexts/CurrencyContext';

export function PriceComparison({ priceINR }) {
  const { formatPrice, convertPrice, currency, symbol } = useCurrency();
  
  if (currency === 'INR') {
    return <span>{formatPrice(priceINR)}</span>;
  }
  
  const converted = convertPrice(priceINR);
  const conversionRate = converted / priceINR;
  
  return (
    <div className="price-comparison">
      <div className="current-price">
        <span className="label">Price</span>
        <span className="value">{formatPrice(converted)}</span>
      </div>
      <div className="original-price">
        <span className="label">Originally</span>
        <span className="value">₹{priceINR}</span>
      </div>
      <div className="exchange-rate">
        <span className="label">Rate</span>
        <span className="value">1 INR = {conversionRate.toFixed(4)} {currency}</span>
      </div>
    </div>
  );
}
```

### Feature 3: Discount Price Display (Multi-Currency)

```jsx
import { useCurrency } from '../contexts/CurrencyContext';

export function DiscountPrice({ originalINR, discountedINR }) {
  const { formatPrice, convertPrice } = useCurrency();
  
  const originalConverted = convertPrice(originalINR);
  const discountedConverted = convertPrice(discountedINR);
  const savings = originalConverted - discountedConverted;
  const discountPercent = Math.round((savings / originalConverted) * 100);
  
  return (
    <div className="discount-price">
      <span className="original">
        <del>{formatPrice(originalConverted)}</del>
      </span>
      <span className="discount">
        {formatPrice(discountedConverted)}
      </span>
      <span className="badge">
        {discountPercent}% OFF
      </span>
    </div>
  );
}
```

### Feature 4: Currency Refresh Trigger

```jsx
import { useCurrency } from '../contexts/CurrencyContext';

export function CurrencyRefreshButton() {
  const { refreshRates, loading } = useCurrency();
  
  return (
    <button
      onClick={refreshRates}
      disabled={loading}
      title="Refresh exchange rates"
    >
      {loading ? '⟳ Refreshing...' : '⟳ Refresh Rates'}
    </button>
  );
}
```

### Feature 5: Price Range Slider (Multi-Currency)

```jsx
import { useCurrency } from '../contexts/CurrencyContext';

export function CurrencyPriceRangeSlider({ minINR, maxINR, onFilter }) {
  const { formatPrice, convertPrice } = useCurrency();
  const [range, setRange] = useState([minINR, maxINR]);
  
  const minConverted = convertPrice(range[0]);
  const maxConverted = convertPrice(range[1]);
  
  return (
    <div className="price-range-slider">
      <input
        type="range"
        min={minINR}
        max={maxINR}
        value={range[0]}
        onChange={(e) => {
          const newRange = [parseInt(e.target.value), range[1]];
          setRange(newRange);
          onFilter(newRange);
        }}
      />
      <input
        type="range"
        min={minINR}
        max={maxINR}
        value={range[1]}
        onChange={(e) => {
          const newRange = [range[0], parseInt(e.target.value)];
          setRange(newRange);
          onFilter(newRange);
        }}
      />
      <p>
        {formatPrice(minConverted)} - {formatPrice(maxConverted)}
      </p>
    </div>
  );
}
```

---

## TROUBLESHOOTING

### Issue: Exchange rates not updating

**Solution:**
```php
// Clear cache manually
require_once 'helpers/currency-helper.php';
clearExchangeRateCache();

// Or visit:
// http://localhost/backend/api/currency.php?action=refresh-rates
```

### Issue: Wrong currency detected

**Solution:**
```javascript
// Check detected country
fetch('/backend/api/currency.php?action=get-currency')
  .then(r => r.json())
  .then(data => console.log('Detected:', data.data));

// Manually set currency
const { setCurrency } = useCurrency();
setCurrency('USD');
```

### Issue: Prices showing as 0

**Solution:**
```javascript
// Check if exchange rates are loaded
fetch('/backend/api/currency.php?action=get-currency')
  .then(r => r.json())
  .then(data => console.log('Rates:', data.exchange_rates));

// Verify product price data
console.log('Product:', product);
// Should have price_inr field
```

### Issue: API timeout errors

**Solution:**
```php
// Increase timeout in currency-config.php
define('GEOLOCATION_API_TIMEOUT', 5);
define('EXCHANGE_RATE_API_TIMEOUT', 8);

// Or use fallback to cache
// The system automatically uses old cache if API fails
```

### Issue: Session not persisting

**Solution:**
```php
// Ensure session is started at top of each API file
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check browser sends cookies
// Settings → "Access-Control-Allow-Credentials: true"
```

---

## TESTING GUIDE

### Unit Testing Currency Conversion

```php
// test-currency.php
<?php
require_once 'helpers/currency-helper.php';

// Test 1: INR to USD
$priceINR = 1199;
$converted = convertCurrency($priceINR, 'USD');
echo "1199 INR = $converted USD\n";
assert($converted > 0, "Conversion failed");

// Test 2: Same currency
$same = convertCurrency(1199, 'INR');
assert($same == 1199, "INR to INR failed");

// Test 3: Invalid currency
$invalid = convertCurrency(1199, 'INVALID');
assert($invalid == 1199, "Invalid currency handling failed");

// Test 4: Country detection
$country = getUserCountry();
assert(strlen($country) === 2, "Invalid country code");

// Test 5: Cache
clearExchangeRateCache();
$rates = getExchangeRates();
assert(isset($rates['USD']), "Exchange rates missing");
?>
```

### Frontend Testing

```javascript
// Check currency context
import { useCurrency } from '../contexts/CurrencyContext';

function TestComponent() {
  const { currency, symbol, convertPrice, formatPrice } = useCurrency();
  
  return (
    <div>
      <p>Currency: {currency}</p>
      <p>Symbol: {symbol}</p>
      <p>1199 INR = {formatPrice(convertPrice(1199))}</p>
    </div>
  );
}
```

### Browser Console Testing

```javascript
// Open DevTools console

// Test 1: Check currency
fetch('/backend/api/currency.php?action=get-currency')
  .then(r => r.json())
  .then(d => console.log('Currency:', d.data));

// Test 2: Convert price
fetch('/backend/api/currency.php?action=convert-price&price=1199&currency=USD')
  .then(r => r.json())
  .then(d => console.log('Converted:', d.data));

// Test 3: Check localStorage
console.log('Current Currency:', localStorage.getItem('currentCurrency'));
console.log('Exchange Rates:', localStorage.getItem('exchangeRates'));

// Test 4: Refresh rates
fetch('/backend/api/currency.php?action=refresh-rates')
  .then(r => r.json())
  .then(d => console.log('New rates:', d.data));
```

---

## PRODUCTION CHECKLIST

- [ ] Test with real VPNs from different countries
- [ ] Verify exchange rates update every 12 hours
- [ ] Check cache file permissions (755)
- [ ] Test with slow internet (API timeouts)
- [ ] Verify no database changes needed
- [ ] Test currency switching persistence
- [ ] Check mobile responsiveness
- [ ] Verify payment integration uses correct prices
- [ ] Test cart with multiple currencies
- [ ] Monitor error logs for API failures
- [ ] Set up alerts for exchange rate API failures
- [ ] Load test with 100+ concurrent users
- [ ] Test with CloudFlare CDN
- [ ] Verify CORS headers correct
- [ ] Test session persistence across requests
- [ ] Check localStorage clear doesn't break anything
- [ ] Verify old cache is used if API fails
- [ ] Test fallback to INR works
- [ ] Monitor bandwidth usage
- [ ] Document currency exclusions (if any)

---

## IMPORTANT NOTES

### When to Update Exchange Rates Manually
- After significant market changes
- For security/maintenance
- Before major sales

Run:
```bash
curl "http://localhost/backend/api/currency.php?action=refresh-rates"
```

### Currency Switching Best Practices

✅ DO:
- Save user selection in localStorage
- Update on page load
- Show current currency prominently
- Refresh rates periodically

❌ DON'T:
- Force refresh on every page
- Make API calls for every product
- Store prices in multiple currencies in DB
- Override detected country without permission

### Performance Tips

1. **Batch conversions**: Convert multiple prices in one go
2. **Cache rates**: Let them stay cached for 12 hours
3. **Use localStorage**: Avoid repeated API calls
4. **Lazy load**: Only convert visible products
5. **Debounce**: Throttle currency changes

### Security

- Validate all currency codes
- Sanitize user input
- Use HTTPS for API calls
- Don't expose sensitive rates
- Rate limit IP changes

