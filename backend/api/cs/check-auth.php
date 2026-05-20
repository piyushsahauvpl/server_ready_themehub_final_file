<?php
/**
 * Validate CS JWT
 * GET: returns user info if valid
 */
error_reporting(E_ALL);
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
 
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
 
require_once __DIR__ . '/../../middleware/auth.php';
 
try {
    $payload = require_jwt(['CUSTOMER_SUPPORT', 'ADMIN']);
   
    echo json_encode([
        'success' => true,
        'authenticated' => true,
        'user' => [
            'id' => $payload['id'],
            'email' => $payload['email'] ?? null,
            'role' => $payload['role'],
            'name' => $payload['name'] ?? null,
            'full_name' => $payload['name'] ?? null
        ]
    ]);
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'authenticated' => false,
        'message' => 'Unauthorized'
    ]);
}
 
 