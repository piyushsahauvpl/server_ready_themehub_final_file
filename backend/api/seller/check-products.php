<?php
/**
 * Seller Products Diagnostic Tool
 * Shows all seller products and their statuses
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
session_start();

// Check if user is authenticated
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

try {
    $conn = getDBConnection();
    $user_id = $_SESSION['user_id'];

    // Get user info
    $userStmt = $conn->prepare("SELECT id, full_name, email FROM users WHERE id = ?");
    $userStmt->bind_param("i", $user_id);
    $userStmt->execute();
    $user = $userStmt->get_result()->fetch_assoc();
    $userStmt->close();

    // Get seller info
    $sellerStmt = $conn->prepare("SELECT id, business_name, payment_confirmed FROM sellers WHERE user_id = ?");
    $sellerStmt->bind_param("i", $user_id);
    $sellerStmt->execute();
    $seller = $sellerStmt->get_result()->fetch_assoc();
    $sellerStmt->close();

    if (!$seller) {
        echo json_encode([
            'success' => true,
            'user' => $user,
            'seller' => null,
            'message' => 'User is not registered as a seller'
        ]);
        $conn->close();
        exit;
    }

    $seller_id = $seller['id'];

    // Get all products for this seller
    $productsStmt = $conn->prepare("
        SELECT id, name, status, created_at, admin_feedback
        FROM products
        WHERE seller_id = ?
        ORDER BY created_at DESC
    ");
    $productsStmt->bind_param("i", $seller_id);
    $productsStmt->execute();
    $products = [];
    $result = $productsStmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
    $productsStmt->close();

    // Count by status
    $statusCounts = [
        'approved' => 0,
        'pending_review' => 0,
        'rejected' => 0,
        'needs_changes' => 0,
        'draft' => 0,
        'null_or_empty' => 0
    ];

    foreach ($products as $p) {
        $status = $p['status'] ?: 'null_or_empty';
        if (isset($statusCounts[$status])) {
            $statusCounts[$status]++;
        }
    }

    echo json_encode([
        'success' => true,
        'user' => $user,
        'seller' => $seller,
        'total_products' => count($products),
        'status_breakdown' => $statusCounts,
        'products' => $products,
        'debug_info' => [
            'seller_id' => $seller_id,
            'query_timestamp' => date('Y-m-d H:i:s')
        ]
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
