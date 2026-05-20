<?php
/**
 * Production Configuration Setup
 * This file initializes all production environment variables
 * and should be included at the start of every API file
 */

// Production Environment
define('ENVIRONMENT', 'production');
define('PRODUCTION_URL', 'https://uptulathemehub.com');
define('API_BASE_URL', 'https://uptulathemehub.com/backend/api');
define('FRONTEND_URL', 'https://uptulathemehub.com');

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'bmcjatrn_uptula_theme_hub');
define('DB_PASS', 'q_Z*}OwLI=r??dZT');
define('DB_NAME', 'bmcjatrn_uptula_theme_hub');

// Razorpay Configuration (Text Keys - Non-Live)
define('RAZORPAY_KEY_ID',         'rzp_test_SUdNz685HnllDx');
define('RAZORPAY_KEY_SECRET',     'UWjbj2D5w0ruh9w0QC2Z303b');
define('RAZORPAY_ACCOUNT_NUMBER', '2323230038852797');
define('RAZORPAY_WEBHOOK_SECRET', 'webhook_secret_key_here');

// CORS Origins
$allowed_origins = [
    'https://uptulathemehub.com',
    'https://www.uptulathemehub.com',
];

// Determine allowed origin for CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origin = in_array($origin, $allowed_origins) ? $origin : $allowed_origins[0];

// Function to set CORS headers
function setCORSHeaders($origin = null) {
    global $allowed_origin;
    $origin = $origin ?? $allowed_origin;
    
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
}

// Handle OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    setCORSHeaders();
    http_response_code(200);
    exit();
}

// Set CORS for all requests
setCORSHeaders();

// Database Connection Function
function getDBConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        http_response_code(500);
        die(json_encode([
            'success' => false,
            'message' => 'Database connection failed',
            'error' => ENVIRONMENT === 'production' ? null : $conn->connect_error
        ]));
    }
    
    $conn->set_charset("utf8mb4");
    return $conn;
}

// Error handling for production
if (ENVIRONMENT === 'production') {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
}

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
