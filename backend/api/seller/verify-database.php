<?php
/**
 * Database Verification for Seller Products
 * Directly queries the database to verify data
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');

require_once '../../config/database.php';

try {
    $conn = getDBConnection();

    // ========== GET ALL SELLERS ==========
    $sellers = [];
    $sellerResult = $conn->query("SELECT id, user_id, business_name, payment_confirmed FROM sellers LIMIT 10");
    while ($row = $sellerResult->fetch_assoc()) {
        $sellers[] = $row;
    }

    // ========== GET SAMPLE PRODUCTS WITH SELLER INFO ==========
    $products = [];
    $productResult = $conn->query("
        SELECT 
            p.id,
            p.name,
            p.seller_id,
            p.status,
            p.created_at,
            s.business_name
        FROM products p
        LEFT JOIN sellers s ON p.seller_id = s.id
        ORDER BY p.created_at DESC
        LIMIT 20
    ");

    while ($row = $productResult->fetch_assoc()) {
        $products[] = $row;
    }

    // ========== COUNT BY STATUS ==========
    $statusResult = $conn->query("
        SELECT 
            status,
            COUNT(*) as count
        FROM products
        GROUP BY status
    ");

    $statusCounts = [];
    while ($row = $statusResult->fetch_assoc()) {
        $statusCounts[] = $row;
    }

    // ========== COUNT APPROVED BY SELLER ==========
    $sellerApprovedResult = $conn->query("
        SELECT 
            s.id,
            s.business_name,
            COUNT(CASE WHEN p.status = 'approved' THEN 1 END) as approved_count,
            COUNT(p.id) as total_count
        FROM sellers s
        LEFT JOIN products p ON s.id = p.seller_id
        GROUP BY s.id
        ORDER BY approved_count DESC
    ");

    $sellerStats = [];
    while ($row = $sellerApprovedResult->fetch_assoc()) {
        $sellerStats[] = $row;
    }

    // ========== TABLE STRUCTURE ==========
    $columnsResult = $conn->query("DESCRIBE products");
    $columns = [];
    while ($row = $columnsResult->fetch_assoc()) {
        if (in_array($row['Field'], ['id', 'name', 'seller_id', 'status', 'created_at'])) {
            $columns[] = $row;
        }
    }

    echo json_encode([
        'success' => true,
        'database_name' => 'themehub_db',
        'sellers_count' => count($sellers),
        'sellers' => $sellers,
        'products_count' => count($products),
        'sample_products' => $products,
        'status_distribution' => $statusCounts,
        'seller_approved_stats' => $sellerStats,
        'products_table_structure' => $columns,
        'timestamp' => date('Y-m-d H:i:s')
    ]);

    $conn->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>
