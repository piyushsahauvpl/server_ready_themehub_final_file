<?php
/**
 * Debug Login Endpoint
 * Shows all request details
 */

// Handle CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: https://uptulathemehub.com');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
    http_response_code(200);
    exit();
}

header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

$debug = [
    'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'NOT SET',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'NOT SET',
    'http_method' => $_SERVER['HTTP_METHOD'] ?? 'NOT SET',
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'NOT SET',
    'has_input' => !empty(file_get_contents('php://input')),
    'input_length' => strlen(file_get_contents('php://input')),
    'all_methods' => [
        'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'] ?? null,
        'HTTP_X_HTTP_METHOD_OVERRIDE' => $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? null,
    ]
];

// Try to get input
$rawInput = @file_get_contents('php://input');
$debug['raw_input'] = substr($rawInput, 0, 200);
$debug['input_json'] = json_decode($rawInput, true);

echo json_encode($debug, JSON_PRETTY_PRINT);
