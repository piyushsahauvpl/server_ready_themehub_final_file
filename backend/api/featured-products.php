<?php
/**
 * Public Featured Products API
 * Endpoint: /api/featured-products.php
 * Returns featured products for homepage (public access)
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ob_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header_remove();
    header('Access-Control-Allow-Origin: https://uptulathemehub.com');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Credentials: true');
    http_response_code(200);
    ob_end_clean();
    exit();
}

header_remove('Access-Control-Allow-Origin');
header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

require_once '../config/database.php';

ob_end_clean();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    $conn = getDBConnection();

    // Check if is_featured column exists
    $checkColumn = $conn->query("SHOW COLUMNS FROM products LIKE 'is_featured'");
    if ($checkColumn->num_rows === 0) {
        // Column doesn't exist, return empty array
        closeDBConnection($conn);
        echo json_encode(['success' => true, 'data' => []]);
        exit;
    }

    // Get featured products (only approved ones)
    $query = "SELECT 
                p.*,
                c.name as category_name,
                f.name as framework_name,
                s.business_name as seller_name,
                u.full_name as seller_full_name
              FROM products p
              LEFT JOIN categories c ON p.category_id = c.id
              LEFT JOIN frameworks f ON p.framework_id = f.id
              LEFT JOIN sellers s ON p.seller_id = s.id
              LEFT JOIN users u ON s.user_id = u.id
              WHERE p.is_featured = 1 AND p.status = 'approved'
              ORDER BY p.created_at DESC
              LIMIT 6";
    
    $result = $conn->query($query);
    $products = [];
    
    while ($row = $result->fetch_assoc()) {
        // Fix image URL if needed
        if ($row['image_url'] && !str_starts_with($row['image_url'], 'http')) {
            $row['image_url'] = 'https://uptulathemehub.com' . ($row['image_url'][0] === '/' ? $row['image_url'] : '/' . $row['image_url']);
        }
        
        // Map to expected format for frontend
        $products[] = [
            'id' => $row['id'],
            'title' => $row['name'],
            'name' => $row['name'],
            'slug' => $row['slug'],
            'description' => $row['description'],
            'price' => floatval($row['price']),
            'old_price' => $row['offer_price'] ? floatval($row['offer_price']) : null,
            'image' => $row['image_url'],
            'image_url' => $row['image_url'],
            'preview_url' => $row['preview_url'],
            'category_name' => $row['category_name'],
            'framework_name' => $row['framework_name'],
            'seller_name' => $row['seller_name'] || $row['seller_full_name'],
            'rating' => 5,
            'downloads' => 0,
            'badge' => 'Featured',
            'created_at' => $row['created_at']
        ];
    }
    
    closeDBConnection($conn);
    echo json_encode(['success' => true, 'data' => $products]);
} catch (Exception $e) {
    error_log("Featured products API error: " . $e->getMessage());
    closeDBConnection($conn);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
