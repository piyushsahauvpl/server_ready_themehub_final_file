<?php
/**
 * ADMIN DIAGNOSTIC: Check Product Approvals
 * Helps admin verify which products were approved
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

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
require_once '../../middleware/auth.php';

try {
    // Verify admin authentication
    $payload = require_jwt(['ADMIN']);
    $adminId = $payload['id'];
    
    error_log("✅ Admin authenticated: $adminId");

} catch (Exception $e) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Admin authentication required',
        'error' => $e->getMessage()
    ]);
    exit;
}

try {
    $conn = getDBConnection();

    // Get all sellers and their product approval status
    $query = "
        SELECT 
            s.id as seller_id,
            s.business_name,
            s.user_id,
            u.full_name,
            u.email,
            COUNT(p.id) as total_products,
            SUM(CASE WHEN p.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
            SUM(CASE WHEN p.status = 'pending_review' THEN 1 ELSE 0 END) as pending_count,
            SUM(CASE WHEN p.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
            SUM(CASE WHEN p.status = 'needs_changes' THEN 1 ELSE 0 END) as needs_changes_count,
            SUM(CASE WHEN p.status IS NULL OR p.status = '' THEN 1 ELSE 0 END) as no_status_count
        FROM sellers s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN products p ON s.id = p.seller_id
        GROUP BY s.id
        ORDER BY s.created_at DESC
    ";

    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }

    $sellers = [];
    while ($row = $result->fetch_assoc()) {
        $sellers[] = $row;
    }

    // Get detailed list of approved products by seller
    $detailQuery = "
        SELECT 
            s.id as seller_id,
            s.business_name,
            p.id as product_id,
            p.name as product_name,
            p.status,
            p.created_at,
            p.reviewed_at,
            p.admin_feedback
        FROM sellers s
        LEFT JOIN products p ON s.id = p.seller_id AND p.status = 'approved'
        ORDER BY s.id, p.created_at DESC
    ";

    $detailResult = $conn->query($detailQuery);
    
    if (!$detailResult) {
        throw new Exception("Detail query failed: " . $conn->error);
    }

    $approvedBySellerDetails = [];
    while ($row = $detailResult->fetch_assoc()) {
        $sellerId = $row['seller_id'];
        if (!isset($approvedBySellerDetails[$sellerId])) {
            $approvedBySellerDetails[$sellerId] = [
                'seller_id' => $row['seller_id'],
                'business_name' => $row['business_name'],
                'approved_products' => []
            ];
        }
        if ($row['product_id']) {
            $approvedBySellerDetails[$sellerId]['approved_products'][] = [
                'id' => $row['product_id'],
                'name' => $row['product_name'],
                'reviewed_at' => $row['reviewed_at']
            ];
        }
    }

    $response = [
        'success' => true,
        'admin_id' => $adminId,
        'timestamp' => date('Y-m-d H:i:s'),
        'summary' => [
            'total_sellers' => count($sellers),
            'sellers_with_products' => count(array_filter($sellers, fn($s) => $s['total_products'] > 0)),
            'sellers_with_approved_products' => count(array_filter($sellers, fn($s) => $s['approved_count'] > 0))
        ],
        'sellers_summary' => $sellers,
        'approved_products_by_seller' => array_values($approvedBySellerDetails)
    ];

    error_log("📤 Admin diagnosis complete: " . json_encode($response['summary']));

    echo json_encode($response);

} catch (Exception $e) {
    error_log('❌ [Admin Diagnosis] Error: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
