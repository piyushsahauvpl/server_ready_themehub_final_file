<?php
/**
 * User Purchases API
 * Endpoint: GET /api/purchases.php
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
header_remove('Access-Control-Allow-Origin');
header_remove('Access-Control-Allow-Methods');
header_remove('Access-Control-Allow-Headers');
header_remove('Access-Control-Allow-Credentials');

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

$userId = $_SESSION['user_id'];
$requestUserId = $_GET['user_id'] ?? $userId;

// Users can only view their own purchases
if ($requestUserId != $userId) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Forbidden'
    ]);
    exit;
}

try {
    $conn = getDBConnection();

    // Check if billing_address and payment_method columns exist
    $columns = $conn->query("SHOW COLUMNS FROM orders LIKE 'billing_address'");
    $hasBillingAddress = $columns->num_rows > 0;
    
        if ($hasBillingAddress) {
                $query = "SELECT 
                                        o.id,
                                        o.user_id,
                                        o.product_id,
                                        o.amount,
                                        o.status,
                                        o.billing_address,
                                        o.payment_method,
                                        o.created_at,
                                        p.id as product_id_full,
                                        p.name as product_name,
                                        p.description as product_description,
                                        p.image_url as product_image,
                                        p.preview_url as product_preview,
                                        p.price as product_price,
                                        p.slug as product_slug,
                                        p.file_url as product_file_url,
                                        p.file_name as product_file_name,
                                        p.seller_id,
                                        r.id as refund_id,
                                        r.status as refund_status,
                                        r.reason as refund_reason,
                                        r.created_at as refund_created_at
                                    FROM orders o
                                    LEFT JOIN products p ON o.product_id = p.id
                                    LEFT JOIN refunds r ON o.id = r.order_id AND r.id = (SELECT MAX(id) FROM refunds WHERE order_id = o.id)
                                    WHERE o.user_id = ?
                                    ORDER BY o.created_at DESC";
        } else {
                $query = "SELECT 
                                        o.id,
                                        o.user_id,
                                        o.product_id,
                                        o.amount,
                                        o.status,
                                        o.created_at,
                                        p.id as product_id_full,
                                        p.name as product_name,
                                        p.description as product_description,
                                        p.image_url as product_image,
                                        p.preview_url as product_preview,
                                        p.price as product_price,
                                        p.slug as product_slug,
                                        p.file_url as product_file_url,
                                        p.file_name as product_file_name,
                                        p.seller_id,
                                        r.id as refund_id,
                                        r.status as refund_status,
                                        r.reason as refund_reason,
                                        r.created_at as refund_created_at
                                    FROM orders o
                                    LEFT JOIN products p ON o.product_id = p.id
                                    LEFT JOIN refunds r ON o.id = r.order_id AND r.id = (SELECT MAX(id) FROM refunds WHERE order_id = o.id)
                                    WHERE o.user_id = ?
                                    ORDER BY o.created_at DESC";
        }
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $purchases = [];
    while ($row = $result->fetch_assoc()) {
        // Fix image URL if relative
        if (!empty($row['product_image']) && !str_starts_with($row['product_image'], 'http')) {
            $row['product_image'] = 'https://uptulathemehub.com' . ($row['product_image'][0] === '/' ? $row['product_image'] : '/' . $row['product_image']);
        }
        // Fix file URL if relative
        if (!empty($row['product_file_url']) && !str_starts_with($row['product_file_url'], 'http')) {
            $row['product_file_url'] = 'https://uptulathemehub.com' . ($row['product_file_url'][0] === '/' ? $row['product_file_url'] : '/' . $row['product_file_url']);

            // Attempt to ensure the URL points to an actual file (index.html) when possible.
            $uploadsDir = dirname(__DIR__) . '/uploads/products/';
            $folderName = !empty($row['product_file_name']) ? $row['product_file_name'] : null;

            // If the file_url already ends with index.html, nothing to do.
            if (stripos($row['product_file_url'], 'index.html') === false && $folderName) {
                // Check for index.html inside the named folder on disk
                $indexPath = $uploadsDir . $folderName . '/index.html';
                if (file_exists($indexPath)) {
                    // Ensure URL ends with /index.html
                    // If product_file_url already contains the folder name but without trailing slash, add it
                    if (substr($row['product_file_url'], -1) === '/') {
                        $row['product_file_url'] = rtrim($row['product_file_url'], '/') . '/index.html';
                    } else {
                        // If URL already ends with folder name (with or without repeating), append /index.html
                        $row['product_file_url'] = rtrim($row['product_file_url'], '/') . '/index.html';
                    }
                } else {
                    // As a fallback, also check if product_file_url path (as stored) corresponds to a folder on disk
                    // Derive potential folder name from the stored URL's last segment
                    $parts = explode('/', trim($row['product_file_url'], '/'));
                    $lastSeg = end($parts);
                    $possibleFolder = $uploadsDir . $lastSeg . '/index.html';
                    if (file_exists($possibleFolder)) {
                        $row['product_file_url'] = rtrim($row['product_file_url'], '/') . '/index.html';
                    }
                }
            }
        }

        $purchases[] = $row;
    }
    
    $stmt->close();
    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'purchases' => $purchases
    ]);

} catch (Exception $e) {
    error_log("Purchases API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error'
    ]);
}
