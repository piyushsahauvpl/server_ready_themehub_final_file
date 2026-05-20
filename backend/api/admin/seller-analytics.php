<?php
/**
 * Seller Analytics API
 * Returns seller-specific analytics and earnings data
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ob_start();

// Handle CORS
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

require_once '../../config/database.php';

session_name('ADMINSESSID');
session_start();
ob_end_clean();

// Allow both admin and seller access
$sellerId = null;
$isAdmin = isset($_SESSION['admin_id']);
$isSeller = isset($_SESSION['seller_id']);

if (!$isAdmin && !$isSeller) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// If seller, use their own ID; if admin, use provided seller_id
if ($isSeller) {
    $sellerId = $_SESSION['seller_id'];
} else {
    $sellerId = intval($_GET['seller_id'] ?? 0);
}

if ($sellerId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid seller ID']);
    exit;
}

try {
    $conn = getDBConnection();

    // Get seller basic info
    $sellerQuery = "SELECT * FROM sellers WHERE id = ?";
    $stmt = $conn->prepare($sellerQuery);
    $stmt->bind_param("i", $sellerId);
    $stmt->execute();
    $seller = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$seller) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Seller not found']);
        exit;
    }

    // Monthly sales chart data (last 12 months)
    $salesQuery = "SELECT 
                    DATE_FORMAT(o.created_at, '%Y-%m') as month,
                    COUNT(*) as order_count,
                    SUM(se.amount) as total_earnings
                   FROM orders o
                   JOIN seller_earnings se ON o.id = se.order_id
                   WHERE se.seller_id = ? 
                   AND o.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                   GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
                   ORDER BY month ASC";
    $stmt = $conn->prepare($salesQuery);
    $stmt->bind_param("i", $sellerId);
    $stmt->execute();
    $salesData = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    // Product performance
    $productQuery = "SELECT 
                      p.id,
                      p.name,
                      p.price,
                      COUNT(o.id) as sales_count,
                      SUM(o.amount) as total_revenue,
                      AVG(pr.rating) as avg_rating,
                      COUNT(pr.id) as review_count
                     FROM products p
                     LEFT JOIN orders o ON p.id = o.product_id
                     LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.status = 'approved'
                     WHERE p.seller_id = ?
                     GROUP BY p.id
                     ORDER BY sales_count DESC
                     LIMIT 10";
    $stmt = $conn->prepare($productQuery);
    $stmt->bind_param("i", $sellerId);
    $stmt->execute();
    $products = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    // Recent earnings
    $earningsQuery = "SELECT 
                       se.*,
                       o.created_at as order_date,
                       p.name as product_name
                      FROM seller_earnings se
                      JOIN orders o ON se.order_id = o.id
                      LEFT JOIN products p ON o.product_id = p.id
                      WHERE se.seller_id = ?
                      ORDER BY se.created_at DESC
                      LIMIT 20";
    $stmt = $conn->prepare($earningsQuery);
    $stmt->bind_param("i", $sellerId);
    $stmt->execute();
    $earnings = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'seller' => $seller,
        'monthly_sales' => $salesData,
        'product_performance' => $products,
        'recent_earnings' => $earnings
    ]);

} catch (Exception $e) {
    error_log("Seller Analytics error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error'
    ]);
}
