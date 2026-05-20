<?php
/**
 * Debug Session Endpoint
 * GET /api/debug-session.php
 * Shows current session state (for troubleshooting only, DELETE in production)
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

// CORS
header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Start session
session_start();

// Return debug info
echo json_encode([
    'php_version' => phpversion(),
    'session_id' => session_id(),
    'session_name' => session_name(),
    'session_cookie_params' => session_get_cookie_params(),
    'session_data' => $_SESSION,
    'request_cookies' => $_COOKIE,
    'request_headers' => [
        'Origin' => $_SERVER['HTTP_ORIGIN'] ?? null,
        'Cookie' => $_SERVER['HTTP_COOKIE'] ?? null,
        'Referer' => $_SERVER['HTTP_REFERER'] ?? null,
    ]
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
