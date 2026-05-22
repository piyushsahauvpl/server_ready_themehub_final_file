<?php
/**
 * ============================================================================
 * CURRENCY INFO API
 * ============================================================================
 * 
 * Endpoint: GET /api/currency.php
 * Returns currency information for the current user
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "country": "US",
 *     "currency": "USD",
 *     "symbol": "$",
 *     "is_manual": false
 *   },
 *   "exchange_rates": {
 *     "USD": 0.012,
 *     "GBP": 0.010,
 *     ...
 *   },
 *   "cache_status": {
 *     "fresh": true,
 *     "age": 3600
 *   }
 * }
 * ============================================================================
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ob_start();

// CORS Headers
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header_remove();
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(200);
    ob_end_clean();
    exit();
}

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Load configuration and helpers
require_once '../config/currency-config.php';
require_once '../helpers/currency-helper.php';

ob_end_clean();

try {
    // Check for action parameter
    $action = $_GET['action'] ?? 'get-currency';
    
    if ($action === 'get-currency') {
        if (!empty($_GET['currency'])) {
            setUserCurrency($_GET['currency']);
        } elseif (!empty($_GET['country']) && preg_match('/^[A-Z]{2}$/', $_GET['country'])) {
            $_SESSION['user_country'] = $_GET['country'];
        }

        // Get current currency information
        $currencyInfo = getCurrencyInfo();
        $exchangeRates = getExchangeRates();
        $cacheStatus = getCacheStatus();
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $currencyInfo,
            'exchange_rates' => $exchangeRates,
            'cache_status' => $cacheStatus
        ]);
        
    } elseif ($action === 'set-currency') {
        // Allow user to manually select currency
        $currency = $_GET['currency'] ?? null;
        
        if (!$currency) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Currency parameter required'
            ]);
            exit;
        }
        
        // Validate and set currency
        if (setUserCurrency($currency)) {
            $exchangeRates = getExchangeRates();
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Currency updated',
                'data' => getCurrencyInfo(),
                'exchange_rates' => $exchangeRates
            ]);
        } else {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid currency code'
            ]);
        }
        
    } elseif ($action === 'convert-price') {
        // Convert a single price
        $price = $_GET['price'] ?? null;
        $currency = $_GET['currency'] ?? getCurrencyInfo()['currency'];
        
        if ($price === null || !is_numeric($price)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Valid price parameter required'
            ]);
            exit;
        }
        
        $converted = convertCurrency((float)$price, $currency);
        $symbol = getCurrencySymbol($currency);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => [
                'price_inr' => round($price, 2),
                'price' => round($price, 2),
                'converted_price' => $converted,
                'price_converted' => $converted,
                'currency' => $currency,
                'currency_symbol' => $symbol,
                'symbol' => $symbol
            ]
        ]);
        
    } elseif ($action === 'convert-prices') {
        // Convert multiple prices
        $prices = $_GET['prices'] ?? ''; // Comma-separated values
        $currency = $_GET['currency'] ?? getCurrencyInfo()['currency'];
        
        if (!$prices) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Prices parameter required'
            ]);
            exit;
        }
        
        $priceList = array_map('trim', explode(',', $prices));
        $converted = [];
        
        foreach ($priceList as $price) {
            if (is_numeric($price)) {
                $converted[] = convertCurrency((float)$price, $currency);
            }
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => [
                'prices_inr' => array_map('floatval', $priceList),
                'prices_converted' => $converted,
                'currency' => $currency,
                'symbol' => getCurrencySymbol($currency)
            ]
        ]);
        
    } elseif ($action === 'refresh-rates') {
        // Manually refresh exchange rates (admin function)
        clearExchangeRateCache();
        $rates = getExchangeRates();
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Exchange rates refreshed',
            'data' => $rates
        ]);
        
    } elseif ($action === 'cache-status') {
        // Get cache status (for debugging)
        $status = getCacheStatus();
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $status
        ]);
        
    } else {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid action'
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
}

?>
