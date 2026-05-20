<?php
/**
 * ============================================================================
 * MULTI-CURRENCY SUPPORT - Helper Functions
 * ============================================================================
 * 
 * This file contains all core functions for multi-currency support:
 * - User country detection via IP
 * - Currency mapping by country
 * - Currency symbols
 * - Exchange rate fetching & caching
 * - Price conversion
 * 
 * Usage: require_once 'helpers/currency-helper.php';
 * ============================================================================
 */

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Get user's country from IP address using ipapi.co (free API, no auth)
 * 
 * @return string Country code (e.g., 'IN', 'US', 'GB')
 */
function getUserCountry() {
    // Check if already detected in current session
    if (!empty($_SESSION['user_country'])) {
        return $_SESSION['user_country'];
    }

    try {
        $ip = getClientIP();
        
        // Validate IP format
        if (!filter_var($ip, FILTER_VALIDATE_IP)) {
            return 'IN'; // Fallback
        }

        // Create stream context with timeout
        $context = stream_context_create([
            'http' => [
                'timeout' => 3,
                'method' => 'GET'
            ]
        ]);
        
        // Fetch country from IP
        $response = @file_get_contents(
            "https://ipapi.co/{$ip}/json/",
            false,
            $context
        );
        
        if ($response === false) {
            return 'IN'; // Fallback if API unreachable
        }
        
        $data = json_decode($response, true);
        $country = $data['country_code'] ?? 'IN';
        
        // Validate country code format
        if (!preg_match('/^[A-Z]{2}$/', $country)) {
            return 'IN';
        }
        
        // Store in session for subsequent requests
        $_SESSION['user_country'] = $country;
        
        return $country;
        
    } catch (Exception $e) {
        error_log("Currency Helper - Country detection error: " . $e->getMessage());
        return 'IN'; // Default to India
    }
}

/**
 * Get currency code for a specific country
 * 
 * @param string $country Country code (e.g., 'US', 'GB')
 * @return string Currency code (e.g., 'USD', 'GBP')
 */
function getCurrencyByCountry($country) {
    // Comprehensive country to currency mapping
    $countryToCurrency = [
        // Asia
        'IN' => 'INR',  // India
        'SG' => 'SGD',  // Singapore
        'JP' => 'JPY',  // Japan
        'CN' => 'CNY',  // China
        'TH' => 'THB',  // Thailand
        'MY' => 'MYR',  // Malaysia
        'PH' => 'PHP',  // Philippines
        'ID' => 'IDR',  // Indonesia
        'VN' => 'VND',  // Vietnam
        'KR' => 'KRW',  // South Korea
        'HK' => 'HKD',  // Hong Kong
        'TW' => 'TWD',  // Taiwan
        'PK' => 'PKR',  // Pakistan
        'BD' => 'BDT',  // Bangladesh
        'LK' => 'LKR',  // Sri Lanka
        
        // Americas
        'US' => 'USD',  // United States
        'CA' => 'CAD',  // Canada
        'MX' => 'MXN',  // Mexico
        'BR' => 'BRL',  // Brazil
        'AR' => 'ARS',  // Argentina
        'CL' => 'CLP',  // Chile
        'CO' => 'COP',  // Colombia
        'PE' => 'PEN',  // Peru
        
        // Europe
        'GB' => 'GBP',  // United Kingdom
        'DE' => 'EUR',  // Germany
        'FR' => 'EUR',  // France
        'IT' => 'EUR',  // Italy
        'ES' => 'EUR',  // Spain
        'NL' => 'EUR',  // Netherlands
        'BE' => 'EUR',  // Belgium
        'AT' => 'EUR',  // Austria
        'CH' => 'CHF',  // Switzerland
        'SE' => 'SEK',  // Sweden
        'NO' => 'NOK',  // Norway
        'DK' => 'DKK',  // Denmark
        'PL' => 'PLN',  // Poland
        'CZ' => 'CZK',  // Czech Republic
        'RU' => 'RUB',  // Russia
        'UA' => 'UAH',  // Ukraine
        
        // Middle East & Africa
        'AE' => 'AED',  // United Arab Emirates
        'SA' => 'SAR',  // Saudi Arabia
        'EG' => 'EGP',  // Egypt
        'ZA' => 'ZAR',  // South Africa
        'NG' => 'NGN',  // Nigeria
        'KE' => 'KES',  // Kenya
        
        // Oceania
        'AU' => 'AUD',  // Australia
        'NZ' => 'NZD',  // New Zealand
    ];
    
    return $countryToCurrency[$country] ?? 'INR'; // Default to INR
}

/**
 * Get currency symbol for display
 * 
 * @param string $currency Currency code (e.g., 'USD', 'INR')
 * @return string Currency symbol (e.g., '$', '₹')
 */
function getCurrencySymbol($currency) {
    $symbols = [
        'INR' => '₹',
        'USD' => '$',
        'GBP' => '£',
        'EUR' => '€',
        'CAD' => 'C$',
        'AUD' => 'A$',
        'NZD' => 'NZ$',
        'SGD' => 'S$',
        'JPY' => '¥',
        'CHF' => 'CHF',
        'CNY' => '¥',
        'SEK' => 'kr',
        'NOK' => 'kr',
        'DKK' => 'kr',
        'PLN' => 'zł',
        'CZK' => 'Kč',
        'RUB' => '₽',
        'UAH' => '₴',
        'AED' => 'د.إ',
        'SAR' => '﷼',
        'EGP' => '£',
        'ZAR' => 'R',
        'NGN' => '₦',
        'KES' => 'KSh',
        'THB' => '฿',
        'MYR' => 'RM',
        'PHP' => '₱',
        'IDR' => 'Rp',
        'VND' => '₫',
        'KRW' => '₩',
        'HKD' => 'HK$',
        'TWD' => 'NT$',
        'PKR' => '₨',
        'BDT' => '৳',
        'LKR' => 'Rs',
        'MXN' => '$',
        'BRL' => 'R$',
        'ARS' => '$',
        'CLP' => '$',
        'COP' => '$',
        'PEN' => 'S/',
    ];
    
    return $symbols[$currency] ?? '$';
}

/**
 * Fetch exchange rates from Frankfurter API (free, no authentication required)
 * Rates are cached for 12 hours to reduce API calls
 * 
 * @return array Exchange rates with INR as base (INR = 1)
 */
function getExchangeRates() {
    try {
        // Cache file location
        $cacheDir = __DIR__ . '/../config';
        $cacheFile = $cacheDir . '/exchange-rates-cache.json';
        
        // Create config directory if it doesn't exist
        if (!is_dir($cacheDir)) {
            @mkdir($cacheDir, 0755, true);
        }
        
        // Check if cache exists and is fresh (12 hours = 43200 seconds)
        if (file_exists($cacheFile)) {
            $cacheData = json_decode(file_get_contents($cacheFile), true);
            
            if (isset($cacheData['timestamp']) && 
                is_array($cacheData['rates']) &&
                (time() - $cacheData['timestamp']) < 43200) {
                return $cacheData['rates'];
            }
        }
        
        // Fetch fresh rates from Frankfurter API
        $context = stream_context_create([
            'http' => [
                'timeout' => 5,
                'method' => 'GET'
            ]
        ]);
        
        $apiUrl = 'https://api.frankfurter.app/latest?from=INR&to=USD,GBP,EUR,CAD,AUD,CHF,JPY,CNY,SGD,AED,SAR,MXN,BRL,NZD,SEK,NOK,DKK,PLN,CZK,RUB,UAH,EGP,ZAR,NGN,KES,THB,MYR,PHP,IDR,VND,KRW,HKD,TWD,PKR,BDT,LKR,ARS,CLP,COP,PEN';
        
        $response = @file_get_contents($apiUrl, false, $context);
        
        if ($response === false) {
            error_log("Currency Helper - API call failed for: $apiUrl");
            
            // Try to return cached rates if available, even if old
            if (file_exists($cacheFile)) {
                $oldCache = json_decode(file_get_contents($cacheFile), true);
                if (isset($oldCache['rates'])) {
                    error_log("Currency Helper - Using old cached rates");
                    return $oldCache['rates'];
                }
            }
            
            // No cache available, return minimal rates
            return ['INR' => 1];
        }
        
        $data = json_decode($response, true);
        
        if (!isset($data['rates']) || !is_array($data['rates'])) {
            error_log("Currency Helper - Invalid API response");
            return ['INR' => 1];
        }
        
        $rates = $data['rates'];
        
        // Add INR as base currency (1:1 conversion)
        $rates['INR'] = 1;
        
        // Save to cache
        $cacheData = [
            'rates' => $rates,
            'timestamp' => time(),
            'source' => 'frankfurter',
            'base' => 'INR'
        ];
        
        @file_put_contents(
            $cacheFile,
            json_encode($cacheData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
            LOCK_EX
        );
        
        return $rates;
        
    } catch (Exception $e) {
        error_log("Currency Helper - Exchange rate error: " . $e->getMessage());
        return ['INR' => 1]; // Fallback
    }
}

/**
 * Convert price from INR to target currency
 * 
 * @param float $priceINR Original price in INR
 * @param string $targetCurrency Target currency code (default: INR)
 * @return float Converted price rounded to 2 decimal places
 */
function convertCurrency($priceINR, $targetCurrency = 'INR') {
    // Validate input
    if (!is_numeric($priceINR) || $priceINR < 0) {
        error_log("Currency Helper - Invalid price: $priceINR");
        return 0;
    }
    
    // If target is INR, return as-is
    if ($targetCurrency === 'INR') {
        return round($priceINR, 2);
    }
    
    // Validate currency code
    if (!preg_match('/^[A-Z]{3}$/', $targetCurrency)) {
        error_log("Currency Helper - Invalid currency code: $targetCurrency");
        return round($priceINR, 2);
    }
    
    try {
        $rates = getExchangeRates();
        
        // Check if rate exists
        if (!isset($rates[$targetCurrency]) || $rates[$targetCurrency] <= 0) {
            error_log("Currency Helper - Rate not found for: $targetCurrency");
            return round($priceINR, 2);
        }
        
        $rate = $rates[$targetCurrency];
        $converted = $priceINR * $rate;
        
        return round($converted, 2);
        
    } catch (Exception $e) {
        error_log("Currency Helper - Conversion error: " . $e->getMessage());
        return round($priceINR, 2);
    }
}

/**
 * Get client's IP address, handling proxies and CDNs
 * 
 * @return string Client IP address
 */
function getClientIP() {
    // Check for IP from shared internet
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    }
    // Check for IP passed from proxy (CloudFlare, Nginx, etc.)
    elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        // Can be multiple IPs, take the first one
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        $ip = trim($ips[0]);
    }
    // Fall back to remote address
    else {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }
    
    // Security: Validate IP format
    if (!filter_var($ip, FILTER_VALIDATE_IP)) {
        return '127.0.0.1';
    }
    
    return $ip;
}

/**
 * Get complete currency information for current user
 * Combines country, currency, and symbol
 * 
 * @return array Array with 'country', 'currency', 'symbol' keys
 */
function getCurrencyInfo() {
    try {
        // Check if overridden by user (manual selection)
        if (!empty($_SESSION['selected_currency'])) {
            $currency = $_SESSION['selected_currency'];
            return [
                'country' => $_SESSION['user_country'] ?? 'IN',
                'currency' => $currency,
                'symbol' => getCurrencySymbol($currency),
                'is_manual' => true
            ];
        }
        
        // Auto-detect
        $country = getUserCountry();
        $currency = getCurrencyByCountry($country);
        $symbol = getCurrencySymbol($currency);
        
        return [
            'country' => $country,
            'currency' => $currency,
            'symbol' => $symbol,
            'is_manual' => false
        ];
        
    } catch (Exception $e) {
        error_log("Currency Helper - Currency info error: " . $e->getMessage());
        
        // Fallback to INR
        return [
            'country' => 'IN',
            'currency' => 'INR',
            'symbol' => '₹',
            'is_manual' => false
        ];
    }
}

/**
 * Allow user to manually select a currency
 * Stores selection in session and should also be saved in frontend localStorage
 * 
 * @param string $currency Currency code to select
 * @return bool True if successful
 */
function setUserCurrency($currency) {
    // Validate currency code
    if (!preg_match('/^[A-Z]{3}$/', $currency)) {
        error_log("Currency Helper - Invalid currency for manual selection: $currency");
        return false;
    }
    
    // Verify it's a valid currency in our system
    $validCurrencies = ['INR', 'USD', 'GBP', 'EUR', 'CAD', 'AUD', 'CHF', 'JPY', 
                        'CNY', 'SGD', 'AED', 'SAR', 'MXN', 'BRL', 'NZD', 'SEK', 
                        'NOK', 'DKK', 'PLN', 'CZK', 'RUB', 'UAH', 'EGP', 'ZAR', 
                        'NGN', 'KES', 'THB', 'MYR', 'PHP', 'IDR', 'VND', 'KRW', 
                        'HKD', 'TWD', 'PKR', 'BDT', 'LKR', 'ARS', 'CLP', 'COP', 'PEN'];
    
    if (!in_array($currency, $validCurrencies)) {
        error_log("Currency Helper - Unsupported currency: $currency");
        return false;
    }
    
    $_SESSION['selected_currency'] = $currency;
    return true;
}

/**
 * Clear exchange rate cache (for manual refresh or maintenance)
 * 
 * @return bool True if cache was cleared
 */
function clearExchangeRateCache() {
    try {
        $cacheFile = __DIR__ . '/../config/exchange-rates-cache.json';
        
        if (file_exists($cacheFile)) {
            return @unlink($cacheFile);
        }
        
        return true; // Already clear
        
    } catch (Exception $e) {
        error_log("Currency Helper - Error clearing cache: " . $e->getMessage());
        return false;
    }
}

/**
 * Get cache status (for debugging and monitoring)
 * 
 * @return array Cache information
 */
function getCacheStatus() {
    try {
        $cacheFile = __DIR__ . '/../config/exchange-rates-cache.json';
        
        if (!file_exists($cacheFile)) {
            return [
                'exists' => false,
                'age' => null,
                'fresh' => false,
                'message' => 'Cache file does not exist'
            ];
        }
        
        $cacheData = json_decode(file_get_contents($cacheFile), true);
        $age = time() - ($cacheData['timestamp'] ?? 0);
        $fresh = $age < 43200; // 12 hours
        
        return [
            'exists' => true,
            'age' => $age,
            'fresh' => $fresh,
            'timestamp' => $cacheData['timestamp'] ?? null,
            'rates_count' => count($cacheData['rates'] ?? []),
            'message' => $fresh ? 'Cache is fresh' : 'Cache is stale'
        ];
        
    } catch (Exception $e) {
        error_log("Currency Helper - Cache status error: " . $e->getMessage());
        return ['error' => $e->getMessage()];
    }
}

?>
