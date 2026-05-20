# MULTI-CURRENCY - TESTING & DEBUG GUIDE

## QUICK VERIFICATION

### 1. Backend API Quick Check

```bash
# Test 1: Get currency info (should return your country)
curl "http://localhost/backend/api/currency.php?action=get-currency" | json_pp

# Test 2: Convert a price
curl "http://localhost/backend/api/currency.php?action=convert-price&price=1199&currency=USD" | json_pp

# Test 3: Check cache status
curl "http://localhost/backend/api/currency.php?action=cache-status" | json_pp

# Test 4: Get products with currency
curl "http://localhost/backend/api/products.php?limit=2" | json_pp
```

### 2. Browser Console Tests

Open DevTools (F12) → Console tab and paste:

```javascript
// Test 1: Fetch currency
fetch('/backend/api/currency.php?action=get-currency')
  .then(r => r.json())
  .then(d => console.log('Currency:', d.data));

// Test 2: Check localStorage
console.log('Stored Currency:', localStorage.getItem('currentCurrency'));
console.log('Exchange Rates:', localStorage.getItem('exchangeRates'));

// Test 3: Test conversion
fetch('/backend/api/currency.php?action=convert-price&price=1199&currency=GBP')
  .then(r => r.json())
  .then(d => console.log('1199 INR =', d.data.price_converted, d.data.currency));

// Test 4: Check CurrencyContext
import { useCurrency } from './contexts/CurrencyContext.jsx';
const ctx = useCurrency();
console.log('Current:', ctx.currency, ctx.symbol);
```

### 3. Network Tab Inspection

1. Open DevTools → Network tab
2. Refresh page
3. Filter by XHR
4. Look for `/backend/api/currency.php` request
5. Check response status (should be 200)
6. Check response payload (should have currency info)

---

## TESTING BY LOCATION

### Test Different Countries

#### Using Browser DevTools (Emulate Country)
```javascript
// Chrome/Edge: DevTools → 3 dots → More tools → Network conditions
// Uncheck "Use browser default"
// Set User-Agent locale to: en-IN, en-US, en-GB, etc.
// Refresh page
```

#### Using VPN
- Install free VPN extension
- Connect to different countries
- Reload page
- Should show that country's currency

#### Using PHP Code (Dev Only)
```php
// Temporarily override in tests
$_SESSION['user_country'] = 'US'; // Force USA
$currency = getCurrencyByCountry($_SESSION['user_country']);
echo "Currency: " . $currency; // Should show USD
```

---

## COMPONENT TESTING

### Test TemplateCard Component

```jsx
import TemplateCard from './TemplateCard';
import { CurrencyProvider } from './contexts/CurrencyContext';

export default function TemplateCardTest() {
  const mockProduct = {
    id: 1,
    title: 'Test Product',
    price_inr: 1199,
    price: 14.38,
    image: 'https://example.com/image.jpg',
    rating: 4.5,
    description: 'Test Description'
  };

  return (
    <CurrencyProvider>
      <TemplateCard item={mockProduct} />
    </CurrencyProvider>
  );
}
```

### Test Currency Context

```jsx
import { CurrencyProvider, useCurrency } from './contexts/CurrencyContext';

function TestCurrency() {
  const { currency, symbol, formatPrice, convertPrice } = useCurrency();
  
  return (
    <div>
      <p>Current Currency: {currency}</p>
      <p>Symbol: {symbol}</p>
      <p>1199 INR = {formatPrice(convertPrice(1199))}</p>
    </div>
  );
}

export default function CurrencyTest() {
  return (
    <CurrencyProvider>
      <TestCurrency />
    </CurrencyProvider>
  );
}
```

---

## API RESPONSE EXAMPLES

### Successful get-currency Response
```json
{
  "success": true,
  "data": {
    "country": "US",
    "currency": "USD",
    "symbol": "$",
    "is_manual": false
  },
  "exchange_rates": {
    "INR": 1,
    "USD": 0.012,
    "GBP": 0.0096,
    "EUR": 0.0093,
    "CAD": 0.0164,
    "AUD": 0.0183,
    ...
  },
  "cache_status": {
    "exists": true,
    "age": 3600,
    "fresh": true
  }
}
```

### Successful convert-price Response
```json
{
  "success": true,
  "data": {
    "price_inr": 1199,
    "price_converted": 14.38,
    "currency": "USD",
    "symbol": "$"
  }
}
```

### Successful products Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Premium Theme",
      "price_inr": 1199,
      "price": 14.38,
      "old_price_inr": null,
      "old_price": null,
      "image": "...",
      ...
    }
  ],
  "currency": {
    "code": "USD",
    "symbol": "$",
    "country": "US",
    "is_manual": false
  }
}
```

---

## ERROR TROUBLESHOOTING

### Error: "Cannot find CurrencyProvider"

**Cause:** Component not wrapped with CurrencyProvider  
**Fix:** In App.jsx, ensure:
```jsx
<CurrencyProvider>
  {/* All routes here */}
</CurrencyProvider>
```

**Or check component is inside Provider:**
```jsx
// ❌ WRONG - Component outside provider
<TemplateCard /> {/* Error! */}

// ✅ CORRECT - Inside provider
<CurrencyProvider>
  <TemplateCard />
</CurrencyProvider>
```

### Error: "useCurrency must be used within CurrencyProvider"

**Cause:** Hook called outside provider scope  
**Fix:**
```jsx
// ❌ WRONG
function MyComponent() {
  const { currency } = useCurrency(); // Error!
  return <div>{currency}</div>;
}

// ✅ CORRECT
function MyComponent() {
  const { currency } = useCurrency(); // Inside provider context
  return <div>{currency}</div>;
}

// Wrap in App.jsx or parent:
export default function App() {
  return (
    <CurrencyProvider>
      <MyComponent />
    </CurrencyProvider>
  );
}
```

### Error: "404 currency.php not found"

**Cause:** File not created in right location  
**Fix:** Verify file exists:
```bash
# Check file exists
ls -la /backend/api/currency.php

# Should show: (rw-r--r--) /backend/api/currency.php
```

### Error: "Cannot read exchange rates"

**Cause:** Cache file not writable  
**Fix:**
```bash
# Set permissions
chmod 755 /backend/config/
chmod 644 /backend/config/exchange-rates-cache.json

# Or create directory
mkdir -p /backend/config/
```

### Error: "Exchange rates are empty"

**Cause:** API not fetching correctly  
**Fix:**
```php
// Test API directly
$rates = getExchangeRates();
var_dump($rates);

// Check error log
tail -f /var/log/php-errors.log
```

### Error: "Session currency not saving"

**Cause:** Session not started or cookies blocked  
**Fix:**
```php
// Ensure session started at top
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Or in browser: check cookies enabled
// Settings → Privacy → Cookies should be allowed
```

---

## DEBUG COMMANDS

### PHP Debugging

```bash
# Test country detection
php -r "
require_once 'helpers/currency-helper.php';
echo 'Country: ' . getUserCountry() . '\n';
"

# Test exchange rates
php -r "
require_once 'helpers/currency-helper.php';
print_r(getExchangeRates());
"

# Test conversion
php -r "
require_once 'helpers/currency-helper.php';
echo convertCurrency(1199, 'USD') . ' USD\n';
"
```

### JavaScript Debugging

```javascript
// Check context
import { useCurrency } from './contexts/CurrencyContext';
const ctx = useCurrency();
console.log('Full Context:', ctx);

// Check state
console.log('Currency:', ctx.currency);
console.log('Symbol:', ctx.symbol);
console.log('Rates:', ctx.exchangeRates);
console.log('Loading:', ctx.loading);
console.log('Error:', ctx.error);

// Test conversion
console.log('Convert 1199 INR to USD:', ctx.convertPrice(1199));

// Test formatting
console.log('Formatted:', ctx.formatPrice(ctx.convertPrice(1199)));
```

### Cache Debugging

```bash
# Check cache file
cat /backend/config/exchange-rates-cache.json | json_pp

# Clear cache
rm /backend/config/exchange-rates-cache.json

# Check cache age
php -r "
\$cache = json_decode(file_get_contents('config/exchange-rates-cache.json'), true);
\$age = time() - \$cache['timestamp'];
echo 'Cache age: ' . \$age . ' seconds\n';
echo 'Fresh: ' . (\$age < 43200 ? 'Yes' : 'No') . '\n';
"
```

---

## PERFORMANCE TESTING

### Measure API Response Time

```javascript
// In browser console
async function testPerformance() {
  console.time('currency-api');
  
  const response = await fetch('/backend/api/currency.php?action=get-currency');
  const data = await response.json();
  
  console.timeEnd('currency-api'); // Shows time in ms
  
  console.log('Response:', data);
}

testPerformance();
```

### Measure Conversion Speed

```javascript
// Test 1000 conversions
async function testConversionSpeed() {
  const { convertPrice } = useCurrency();
  
  console.time('conversions');
  
  for (let i = 0; i < 1000; i++) {
    convertPrice(1199);
  }
  
  console.timeEnd('conversions'); // Should be <10ms
}
```

### Check Network Load

```javascript
// In DevTools → Performance tab
// 1. Click record
// 2. Reload page
// 3. Wait for page load
// 4. Click stop
// 5. Check network requests for /backend/api/currency.php
```

---

## LOAD TESTING

### Simple Load Test

```bash
# Using Apache Bench
ab -n 100 -c 10 "http://localhost/backend/api/currency.php?action=get-currency"

# Should show:
# - Response time < 100ms
# - No errors
# - Cache working (faster subsequent requests)
```

### Concurrent Users Test

```bash
# Using curl with loop
for i in {1..100}; do
  curl -s "http://localhost/backend/api/currency.php?action=get-currency" &
done
wait

# All should complete without errors
```

---

## LOCALHOST TESTING CHECKLIST

- [ ] PHP server running (`php -S localhost:8000`)
- [ ] MySQL database connected
- [ ] Cache directory exists and writable
- [ ] Session directory writable
- [ ] No SSL certificate errors
- [ ] CORS headers correct
- [ ] All API endpoints responding
- [ ] Frontend loads correctly
- [ ] CurrencyContext initializes
- [ ] Prices display in detected currency
- [ ] Manual currency selection works
- [ ] LocalStorage persisting data
- [ ] Browser console clear (no errors)
- [ ] Network tab shows all requests successful

---

## PRODUCTION TESTING CHECKLIST

- [ ] Test from 3+ different countries (VPN or real)
- [ ] Test with slow internet (throttle to 3G)
- [ ] Test API timeouts (disable API, should use cache)
- [ ] Test cache expiry (wait 12 hours or manually)
- [ ] Test currency switching persistence
- [ ] Test mobile devices
- [ ] Test touch/click interactions
- [ ] Monitor error logs (no warnings)
- [ ] Check database performance
- [ ] Monitor exchange rate API calls
- [ ] Verify HTTPS working
- [ ] Test with CloudFlare CDN
- [ ] Load test with 100+ concurrent users
- [ ] Check for memory leaks (browser)
- [ ] Verify payment works with all currencies

---

## LOGGING

### Enable Currency Logging

In `/backend/config/currency-config.php`:
```php
define('ENABLE_CURRENCY_LOGGING', true); // Default: true
```

### View Logs

```bash
# Tail live logs
tail -f /var/www/html/logs/currency.log

# Show last 50 lines
tail -n 50 /var/www/html/logs/currency.log

# Search for specific currency
grep "USD" /var/www/html/logs/currency.log

# Count operations
wc -l /var/www/html/logs/currency.log
```

### Log Example
```
[2024-05-18 10:30:45] [203.0.113.15] Operation: get_currency | Data: {"country":"US","currency":"USD"}
[2024-05-18 10:30:46] [203.0.113.15] Operation: convert_price | Data: {"price":1199,"currency":"USD","result":14.38}
```

---

## QUICK FIXES

### "Prices still showing INR"
```javascript
// Force refresh
localStorage.clear();
location.reload();
```

### "Exchange rates not updating"
```bash
curl "http://localhost/backend/api/currency.php?action=refresh-rates"
```

### "Component not rendering"
```bash
# Check console errors
# Open DevTools F12 → Console
# Should be empty (no red errors)
```

### "API not responding"
```bash
# Test connectivity
ping api.frankfurter.app

# Test timeout
curl --max-time 2 "https://api.frankfurter.app/latest?from=INR"
```

---

## MONITORING

### Key Metrics to Monitor

1. **Exchange Rate API Response Time**
   - Should be < 2 seconds
   - Alert if > 5 seconds

2. **Cache Hit Rate**
   - Should be > 95%
   - Each request shouldn't fetch new rates

3. **IP Geo API Response Time**
   - Should be < 500ms
   - Alert if > 1 second

4. **Error Rate**
   - Should be < 0.1%
   - Monitor error logs

5. **Database Impact**
   - No new database queries
   - Should not increase DB load

---

## ALERTS TO SET UP

- [ ] Exchange rate API down (timeout or 5xx error)
- [ ] IP geolocation API down
- [ ] Cache file corrupted or missing
- [ ] High error rate (> 1%)
- [ ] API response time > 2 seconds
- [ ] Cache not updating for 24+ hours

---

## COMMON QUESTIONS

**Q: Why is the user seeing INR even with VPN?**
A: IP detection might be delayed. Try:
```javascript
localStorage.removeItem('currentCurrency');
location.reload();
```

**Q: Can I test multiple currencies locally?**
A: Yes, use browser DevTools to spoof location or modify session:
```php
$_SESSION['user_country'] = 'US'; // In a test file
```

**Q: How do I test without internet?**
A: Exchange rates are cached 12 hours, so it will work offline for cached currencies.

**Q: Performance impact?**
A: 
- First load: +200-500ms
- Cached loads: <50ms
- Per-conversion: <1ms

**Q: Can I use a different exchange rate API?**
A: Yes, modify `getExchangeRates()` in `/backend/helpers/currency-helper.php`

