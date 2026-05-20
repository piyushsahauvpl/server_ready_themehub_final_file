<?php
/**
 * Orders API
 * Endpoint: GET /api/orders.php (get user orders)
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ob_start();

// Handle CORS and OPTIONS request FIRST
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header_remove();
    header('Access-Control-Allow-Origin: https://uptulathemehub.com');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Accept');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
    http_response_code(200);
    ob_end_clean();
    exit();
}

// Set CORS headers
header_remove();
header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Accept');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

require_once '../config/database.php';

// Start session
session_start();
ob_end_clean();

// Check authentication
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized'
    ]);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'User ID not found in session'
    ]);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    $conn = getDBConnection();

    // ✅ Fetch ONLY PAID orders
    $query = "SELECT 
                o.id,
                o.user_id,
                o.product_id,
                o.amount,
                o.status,
                o.created_at,

                -- Product Info
                p.name as product_name,
                p.description as product_description,
                p.image_url as product_image,
                p.preview_url as product_preview,
                p.price as product_price,
                p.slug as product_slug,
                p.file_name as product_file_name,
                p.seller_id

              FROM orders o
              LEFT JOIN products p ON o.product_id = p.id
              WHERE o.user_id = ? AND o.status = 'completed'
              ORDER BY o.created_at DESC";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();

    $result = $stmt->get_result();

    $orders = [];

    while ($row = $result->fetch_assoc()) {

        // ✅ Fix image URL if relative
        if (!empty($row['product_image']) && !str_starts_with($row['product_image'], 'http')) {
            $row['product_image'] = 'https://uptulathemehub.com' .
                ($row['product_image'][0] === '/' ? $row['product_image'] : '/' . $row['product_image']);
        }

        // 🔐 REMOVE direct file access (important)
        // (we do NOT expose product_file_url anymore)

        // ✅ Add secure download endpoint
        $row['download_url'] = "/backend/api/download.php?product_id=" . $row['product_id'];

        $orders[] = $row;
    }

    $stmt->close();
    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'orders' => $orders
    ]);

} catch (Exception $e) {
    error_log("Orders API error: " . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error'
    ]);
}