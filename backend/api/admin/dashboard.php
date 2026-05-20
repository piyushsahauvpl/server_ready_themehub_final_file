<?php
/**
 * Dashboard Statistics API
 * Endpoint: GET /api/admin/dashboard.php
 */
 
require_once '../../config/database.php';
require_once '../../config/jwt.php';
require_once '../../middleware/auth.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_jwt(['ADMIN']);
$conn = getDBConnection();
 
// Get statistics
$stats = [];
 
// Total Users
$result = $conn->query("SELECT COUNT(*) as count FROM users");
$stats['users'] = $result->fetch_assoc()['count'];
 
// Total Products
$result = $conn->query("SELECT COUNT(*) as count FROM products");
$stats['products'] = $result->fetch_assoc()['count'];
 
// Total Orders
$result = $conn->query("SELECT COUNT(*) as count FROM orders");
$stats['orders'] = $result->fetch_assoc()['count'];
 
// Total Revenue
$result = $conn->query("SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status = 'completed'");
$stats['revenue'] = floatval($result->fetch_assoc()['total']);
 
// Revenue by month (last 6 months)
$revenueData = [];
$result = $conn->query("
    SELECT
        DATE_FORMAT(created_at, '%b') as month,
        SUM(amount) as total
    FROM orders
    WHERE status = 'completed'
    AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    ORDER BY created_at ASC
");
while ($row = $result->fetch_assoc()) {
    $revenueData[] = [
        'month' => $row['month'],
        'amount' => floatval($row['total'])
    ];
}
 
// Customer Growth (last 4 months)
$customerGrowth = [];
$result = $conn->query("
    SELECT
        DATE_FORMAT(created_at, '%b') as month,
        COUNT(*) as count
    FROM users
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 4 MONTH)
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    ORDER BY created_at ASC
");
while ($row = $result->fetch_assoc()) {
    $customerGrowth[] = [
        'month' => $row['month'],
        'count' => intval($row['count'])
    ];
}
 
// Top Selling Categories
$topCategories = [];
$result = $conn->query("
    SELECT
        c.name,
        COUNT(o.id) as order_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id
    LEFT JOIN orders o ON p.id = o.product_id AND o.status = 'completed'
    GROUP BY c.id, c.name
    ORDER BY order_count DESC
    LIMIT 3
");
while ($row = $result->fetch_assoc()) {
    $topCategories[] = [
        'name' => $row['name'],
        'count' => intval($row['order_count'])
    ];
}
 
// Popular Frameworks
$popularFrameworks = [];
$result = $conn->query("
    SELECT
        f.name,
        COUNT(p.id) as product_count
    FROM frameworks f
    LEFT JOIN products p ON f.id = p.framework_id
    GROUP BY f.id, f.name
    ORDER BY product_count DESC
    LIMIT 4
");
while ($row = $result->fetch_assoc()) {
    $popularFrameworks[] = [
        'name' => $row['name'],
        'count' => intval($row['product_count'])
    ];
}
 
closeDBConnection($conn);
 
echo json_encode([
    'success' => true,
    'stats' => $stats,
    'revenueData' => $revenueData,
    'customerGrowth' => $customerGrowth,
    'topCategories' => $topCategories,
    'popularFrameworks' => $popularFrameworks
]);
 
 