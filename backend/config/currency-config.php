<?php
/**
 * ============================================================================
 * MULTI-CURRENCY SUPPORT - Configuration
 * ============================================================================
 * 
 * Centralized configuration for currency support
 * Adjust these settings as needed
 * 
 * Usage: require_once 'config/currency-config.php';
 * ============================================================================
 */

// ============================================================================
// CACHE SETTINGS
// ============================================================================

// How long to cache exchange rates (in seconds)
// 43200 = 12 hours (default, good balance between freshness and performance)
define('CURRENCY_CACHE_DURATION', 43200);

// Cache file location (relative to this file)
define('CURRENCY_CACHE_FILE', __DIR__ . '/exchange-rates-cache.json');

// ============================================================================
// API SETTINGS
// ============================================================================

// Geolocation API endpoint and timeout
define('GEOLOCATION_API_ENDPOINT', 'https://ipapi.co/{ip}/json/');
define('GEOLOCATION_API_TIMEOUT', 3); // seconds

// Exchange rate API endpoint and timeout
define('EXCHANGE_RATE_API_ENDPOINT', 'https://api.frankfurter.app/latest');
define('EXCHANGE_RATE_API_TIMEOUT', 5); // seconds

// Supported currencies (used in API calls)
define('SUPPORTED_CURRENCIES', 'USD,GBP,EUR,CAD,AUD,CHF,JPY,CNY,SGD,AED,SAR,MXN,BRL,NZD,SEK,NOK,DKK,PLN,CZK,RUB,UAH,EGP,ZAR,NGN,KES,THB,MYR,PHP,IDR,VND,KRW,HKD,TWD,PKR,BDT,LKR,ARS,CLP,COP,PEN');

// ============================================================================
// FEATURE FLAGS
// ============================================================================

// Enable automatic currency detection
define('ENABLE_AUTO_CURRENCY_DETECTION', true);

// Enable currency switching/override
define('ENABLE_CURRENCY_SWITCHING', true);

// Enable caching
define('ENABLE_CURRENCY_CACHE', true);

// Enable logging
define('ENABLE_CURRENCY_LOGGING', true);

// ============================================================================
// FALLBACK SETTINGS
// ============================================================================

// Default country if detection fails
define('DEFAULT_COUNTRY', 'IN');

// Default currency if detection fails
define('DEFAULT_CURRENCY', 'INR');

// Default symbol
define('DEFAULT_SYMBOL', '₹');

// ============================================================================
// COUNTRY TO CURRENCY MAPPING
// ============================================================================

function getCurrencyMappingArray() {
    return [
        // Asia
        'IN' => 'INR',
        'SG' => 'SGD',
        'JP' => 'JPY',
        'CN' => 'CNY',
        'TH' => 'THB',
        'MY' => 'MYR',
        'PH' => 'PHP',
        'ID' => 'IDR',
        'VN' => 'VND',
        'KR' => 'KRW',
        'HK' => 'HKD',
        'TW' => 'TWD',
        'PK' => 'PKR',
        'BD' => 'BDT',
        'LK' => 'LKR',
        
        // Americas
        'US' => 'USD',
        'CA' => 'CAD',
        'MX' => 'MXN',
        'BR' => 'BRL',
        'AR' => 'ARS',
        'CL' => 'CLP',
        'CO' => 'COP',
        'PE' => 'PEN',
        
        // Europe
        'GB' => 'GBP',
        'DE' => 'EUR',
        'FR' => 'EUR',
        'IT' => 'EUR',
        'ES' => 'EUR',
        'NL' => 'EUR',
        'BE' => 'EUR',
        'AT' => 'EUR',
        'CH' => 'CHF',
        'SE' => 'SEK',
        'NO' => 'NOK',
        'DK' => 'DKK',
        'PL' => 'PLN',
        'CZ' => 'CZK',
        'RU' => 'RUB',
        'UA' => 'UAH',
        
        // Middle East & Africa
        'AE' => 'AED',
        'SA' => 'SAR',
        'EG' => 'EGP',
        'ZA' => 'ZAR',
        'NG' => 'NGN',
        'KE' => 'KES',
        
        // Oceania
        'AU' => 'AUD',
        'NZ' => 'NZD',
    ];
}

// ============================================================================
// CURRENCY SYMBOLS
// ============================================================================

function getCurrencySymbolsArray() {
    return [
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
}

// ============================================================================
// PRECISION SETTINGS
// ============================================================================

// Decimal places for different currencies
function getCurrencyPrecisionArray() {
    return [
        'JPY' => 0,    // Japanese Yen (no decimals)
        'KRW' => 0,    // Korean Won (no decimals)
        'VND' => 0,    // Vietnamese Dong (no decimals)
        'INR' => 2,    // Default for all others
        'USD' => 2,
        'GBP' => 2,
        'EUR' => 2,
    ];
}

/**
 * Get decimal precision for a currency
 */
function getCurrencyPrecision($currency) {
    $precision = getCurrencyPrecisionArray();
    return $precision[$currency] ?? 2; // Default to 2 decimals
}

// ============================================================================
// HELPER FUNCTION: Log currency operations
// ============================================================================

function logCurrencyOperation($operation, $data = []) {
    if (!ENABLE_CURRENCY_LOGGING) {
        return;
    }
    
    $logFile = __DIR__ . '/../../logs/currency.log';
    
    // Create logs directory if it doesn't exist
    if (!is_dir(dirname($logFile))) {
        @mkdir(dirname($logFile), 0755, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    
    $message = "[{$timestamp}] [$ip] Operation: {$operation}";
    if (!empty($data)) {
        $message .= " | Data: " . json_encode($data);
    }
    $message .= "\n";
    
    @file_put_contents($logFile, $message, FILE_APPEND);
}

?>
