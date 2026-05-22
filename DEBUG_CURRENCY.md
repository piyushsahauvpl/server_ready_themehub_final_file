# Currency Conversion Debugging Guide

## To Debug in Browser Console:

```javascript
// 1. Check if CurrencyContext is working
const context = useCurrency(); // Won't work directly in console
// Instead, check localStorage:
console.log('Stored Currency:', localStorage.getItem('currentCurrency'));
console.log('Stored Rates:', localStorage.getItem('exchangeRates'));
console.log('Cached Timestamp:', localStorage.getItem('exchangeRatesTimestamp'));

// 2. Check what the API is returning
fetch('https://uptulathemehub.com/backend/api/currency.php?action=get-currency')
  .then(r => r.json())
  .then(data => console.log('Currency API:', JSON.stringify(data, null, 2)));

// 3. Check products API
fetch('https://uptulathemehub.com/backend/api/products.php?currency=USD&limit=1')
  .then(r => r.json())
  .then(data => {
    console.log('Products API Response:');
    console.log('- Item has converted_price:', !!data.data[0]?.converted_price);
    console.log('- Item currency:', data.data[0]?.currency);
    console.log('- Item currency_symbol:', data.data[0]?.currency_symbol);
    console.log('Full item:', JSON.stringify(data.data[0], null, 2));
  });

// 4. Test formatDisplayPrice directly
// In console on a page that uses it:
copy(localStorage.getItem('exchangeRates'));
// This will show the rates that are cached
```

## Check these URLs with VPN:

1. **Geolocation**: https://ipapi.co/json/ (should show VPN country)

2. **Currency Detection**: https://uptulathemehub.com/backend/api/currency.php?action=get-currency
   - Should show VPN country and correct currency

3. **Product with Conversion**: https://uptulathemehub.com/backend/api/products.php?currency=USD&limit=1
   - Should show:
     - price_inr: original INR price
     - converted_price: converted to USD
     - currency: "USD"
     - currency_symbol: "$"

## Expected Behavior by Page:

### Homepage (LatestTemplates)
- Fetches: /api/latest-products.php?currency=USD
- Should show: prices in USD ($)
- If showing INR (₹): check browser console for errors, check if latest-products API returns converted_price

### Templates Listing Page
- Fetches: /api/products.php?currency=USD
- Should show: prices in USD ($)
- If showing INR (₹): products API might not be setting currency_symbol correctly

### Template Details
- Fetches: /api/products.php?id=SLUG&currency=USD
- Should show: converted price in USD
- If symbol wrong: check if item.currency_symbol is set in API response

## Debugging Steps:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Look for `/api/currency.php` - check response has exchange_rates field
4. Look for `/api/products.php` - check response items have:
   - converted_price (number)
   - currency (string, e.g., "USD")
   - currency_symbol (string, e.g., "$")
5. Go to Console tab and run the tests above
6. Check localStorage to see if exchange rates are cached

## Common Issues:

1. **Exchange rates = {INR: 1}**
   - Frankfurt API not called or failed
   - Check backend logs for error

2. **converted_price = original price (499 instead of 5.99)**
   - convertCurrency function not working
   - Exchange rate not loaded

3. **Symbol shows ₹ instead of $**
   - currency_symbol not in API response
   - Or formatDisplayPrice using wrong source

4. **Only Detail page works**
   - Other APIs not returning converted_price/currency_symbol
   - Check latest-products.php and featured-products.php

## If Nothing Works:

1. Clear browser cache and localStorage
2. Stop/start PHP server
3. Check backend/config/exchange-rates-cache.json exists
4. Check PHP error logs
5. Test Frankfurt API directly: https://api.frankfurter.app/latest?from=INR
