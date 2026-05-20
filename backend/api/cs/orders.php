<?php
/**
 * CS Orders API - Get all orders with user details
 * Endpoint: GET /api/cs/orders.php
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
require_once __DIR__ . '/../../config/database.php';
 
// Start session for session-based auth fallback
if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}
 
try {
    // Require CS or Admin role
    $payload = require_jwt(['CUSTOMER_SUPPORT', 'ADMIN']);
   
    $conn = getDBConnection();
   
    // Get all orders with user and product details
    $query = "SELECT
                o.id,
                o.user_id,
                o.product_id,
                o.amount,
                o.status,
                o.billing_address,
                o.payment_method,
                o.created_at,
                u.id as user_id_full,
                u.full_name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                u.photo_url as user_photo,
                p.id as product_id_full,
                p.name as product_name,
                p.description as product_description,
                p.image_url as product_image,
                p.preview_url as product_preview,
                p.price as product_price,
                p.slug as product_slug
              FROM orders o
              LEFT JOIN users u ON o.user_id = u.id
              LEFT JOIN products p ON o.product_id = p.id
              ORDER BY o.created_at DESC";
   
    $result = $conn->query($query);
   
    $orders = [];
    while ($row = $result->fetch_assoc()) {
        // Fix image URLs if relative
            if ($row['product_image'] && !str_starts_with($row['product_image'], 'http')) {
                $row['product_image'] = 'https://uptulathemehub.com' . ($row['product_image'][0] === '/' ? $row['product_image'] : '/' . $row['product_image']);
            }
            if ($row['user_photo'] && !str_starts_with($row['user_photo'], 'http')) {
                $row['user_photo'] = 'https://uptulathemehub.com' . ($row['user_photo'][0] === '/' ? $row['user_photo'] : '/' . $row['user_photo']);
            }
        $orders[] = $row;
    }
   
    closeDBConnection($conn);
   
    echo json_encode([
        'success' => true,
        'orders' => $orders,
        'total' => count($orders)
    ]);
   
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error',
        'error' => $e->getMessage()
    ]);
}
 
 