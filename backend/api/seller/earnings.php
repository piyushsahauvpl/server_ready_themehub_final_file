<?php
/**
 * Seller Earnings API
 * GET: Fetch earnings data for authenticated seller
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../config/database.php';
session_start();

// ✅ Check authentication (support regular users and seller sessions)
$user_id = $_SESSION['user_id'] ?? $_SESSION['seller_user_id'] ?? null;
$seller_id = $_SESSION['seller_id'] ?? null;

error_log("🔍 [earnings.php] user_id: $user_id, seller_id: $seller_id");

if (!$user_id && !$seller_id) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized - Please login']);
    exit;
}

try {
    $conn = getDBConnection();

    // Try direct seller_id from session first (best path)
    if ($seller_id) {
        $stmt = $conn->prepare("
            SELECT id, business_name, total_earnings, pending_earnings
            FROM sellers
            WHERE id = ?
        ");
        $stmt->bind_param("i", $seller_id);
    } else {
        $stmt = $conn->prepare("
            SELECT id, business_name, total_earnings, pending_earnings
            FROM sellers 
            WHERE user_id = ?
        ");
        $stmt->bind_param("i", $user_id);
    }
    $stmt->execute();
    $seller = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    error_log("✅ [earnings.php] Seller found: " . json_encode($seller));

    if (!$seller) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Not a verified seller']);
        exit;
    }

    $seller_id = $seller['id'];

    // =========================================================
    // ✅ 1. RECENT EARNINGS (REAL DATA)
    // =========================================================
    $recent_earnings = [];
    
    // Check if orders table has seller_id column
    $columnsCheck = $conn->query("SHOW COLUMNS FROM orders LIKE 'seller_id'");
    
    if ($columnsCheck->num_rows > 0) {
        // Use seller_id directly
        $stmt = $conn->prepare("
            SELECT 
                o.id,
                p.name AS product_name,
                CONCAT('#', o.id) AS order_id,
                o.amount,
                o.created_at AS date,
                o.status
            FROM orders o
            JOIN products p ON o.product_id = p.id
            WHERE o.seller_id = ?
            ORDER BY o.created_at DESC
            LIMIT 10
        ");
        $stmt->bind_param("i", $seller_id);
    } else {
        // Get seller_id from products table
        $stmt = $conn->prepare("
            SELECT 
                o.id,
                p.name AS product_name,
                CONCAT('#', o.id) AS order_id,
                o.amount,
                o.created_at AS date,
                o.status
            FROM orders o
            JOIN products p ON o.product_id = p.id
            WHERE p.seller_id = ?
            ORDER BY o.created_at DESC
            LIMIT 10
        ");
        $stmt->bind_param("i", $seller_id);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $recent_earnings[] = [
            'id' => $row['id'],
            'product_name' => $row['product_name'],
            'order_id' => $row['order_id'],
            'amount' => '₹' . $row['amount'],
            'date' => $row['date'],
            'status' => $row['status']
        ];
    }
    $stmt->close();

    error_log("✅ [earnings.php] Recent earnings: " . count($recent_earnings) . " records");

    // =========================================================
    // ✅ 2. MONTHLY SALES (REAL DATA)
    // =========================================================
    $monthly_sales = [];
    
    if ($columnsCheck->num_rows > 0) {
        $stmt = $conn->prepare("
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') AS month,
                COUNT(*) AS order_count,
                SUM(amount) AS total_earnings
            FROM orders
            WHERE seller_id = ?
            GROUP BY month
            ORDER BY month ASC
        ");
        $stmt->bind_param("i", $seller_id);
    } else {
        $stmt = $conn->prepare("
            SELECT 
                DATE_FORMAT(o.created_at, '%Y-%m') AS month,
                COUNT(*) AS order_count,
                SUM(o.amount) AS total_earnings
            FROM orders o
            JOIN products p ON o.product_id = p.id
            WHERE p.seller_id = ?
            GROUP BY month
            ORDER BY month ASC
        ");
        $stmt->bind_param("i", $seller_id);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $monthly_sales[] = [
            'month' => $row['month'],
            'order_count' => (int)($row['order_count'] ?? 0),
            'total_earnings' => (float)($row['total_earnings'] ?? 0)
        ];
    }
    $stmt->close();

    error_log("✅ [earnings.php] Monthly sales: " . count($monthly_sales) . " records");

    // =========================================================
    // ✅ 3. PRODUCT PERFORMANCE (REAL DATA)
    // =========================================================
    $product_performance = [];
    
    // Check if reviews table exists
    $reviewsCheck = $conn->query("SHOW TABLES LIKE 'reviews'");
    
    if ($reviewsCheck->num_rows > 0) {
        $stmt = $conn->prepare("
            SELECT 
                p.id,
                p.name,
                COUNT(o.id) AS sales_count,
                COALESCE(SUM(o.amount), 0) AS total_revenue,
                COALESCE(AVG(r.rating), 0) AS avg_rating,
                COUNT(r.id) AS review_count
            FROM products p
            LEFT JOIN orders o ON o.product_id = p.id
            LEFT JOIN reviews r ON r.product_id = p.id
            WHERE p.seller_id = ?
            GROUP BY p.id
        ");
    } else {
        $stmt = $conn->prepare("
            SELECT 
                p.id,
                p.name,
                COUNT(o.id) AS sales_count,
                COALESCE(SUM(o.amount), 0) AS total_revenue,
                0 AS avg_rating,
                0 AS review_count
            FROM products p
            LEFT JOIN orders o ON o.product_id = p.id
            WHERE p.seller_id = ?
            GROUP BY p.id
        ");
    }
    
    $stmt->bind_param("i", $seller_id);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $product_performance[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'sales_count' => (int)($row['sales_count'] ?? 0),
            'total_revenue' => (float)($row['total_revenue'] ?? 0),
            'avg_rating' => round((float)($row['avg_rating'] ?? 0), 1),
            'review_count' => (int)($row['review_count'] ?? 0)
        ];
    }
    $stmt->close();

    error_log("✅ [earnings.php] Product performance: " . count($product_performance) . " records");

    // =========================================================
    // ✅ FINAL RESPONSE (UNCHANGED STRUCTURE)
    // =========================================================
    $response = [
        'success' => true,
        'seller' => [
            'id' => $seller['id'],
            'business_name' => $seller['business_name'],
            'total_earnings' => floatval($seller['total_earnings'] ?? 0),
            'pending_earnings' => floatval($seller['pending_earnings'] ?? 0),
            'paid_earnings' => max(
                0,
                floatval($seller['total_earnings'] ?? 0) - floatval($seller['pending_earnings'] ?? 0)
            )
        ],
        'recent_earnings' => $recent_earnings,
        'monthly_sales' => $monthly_sales,
        'product_performance' => $product_performance
    ];

    error_log("📤 [earnings.php] Response ready, success: true");

    echo json_encode($response);

    $conn->close();

} catch (Exception $e) {
    error_log("❌ [earnings.php] Exception: " . $e->getMessage());
    error_log("❌ [earnings.php] Trace: " . $e->getTraceAsString());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error loading earnings: ' . $e->getMessage()
    ]);
}
?>