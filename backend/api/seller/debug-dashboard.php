<?php
/**
 * Complete Seller Dashboard Debug Tool
 * Shows everything needed for seller dashboard stats
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

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

try {
    $conn = getDBConnection();
    $user_id = $_SESSION['user_id'];

    // ========== GET USER ==========
    $userStmt = $conn->prepare("SELECT id, full_name, email FROM users WHERE id = ?");
    $userStmt->bind_param("i", $user_id);
    $userStmt->execute();
    $user = $userStmt->get_result()->fetch_assoc();
    $userStmt->close();

    // ========== GET SELLER ==========
    $sellerStmt = $conn->prepare("
        SELECT id, user_id, business_name, payment_confirmed 
        FROM sellers WHERE user_id = ?
    ");
    $sellerStmt->bind_param("i", $user_id);
    $sellerStmt->execute();
    $seller = $sellerStmt->get_result()->fetch_assoc();
    $sellerStmt->close();

    if (!$seller) {
        echo json_encode([
            'success' => false,
            'message' => 'Not a seller',
            'user' => $user,
            'seller' => null
        ]);
        $conn->close();
        exit;
    }

    $seller_id = $seller['id'];

    // ========== CHECK STATUS COLUMN ==========
    $statusColumnCheck = $conn->query("SHOW COLUMNS FROM products LIKE 'status'");
    $hasStatusColumn = $statusColumnCheck->num_rows > 0;

    // ========== GET ALL PRODUCTS FOR THIS SELLER ==========
    $allProductsStmt = $conn->prepare("
        SELECT id, name, status, price, category_id, framework_id, created_at
        FROM products
        WHERE seller_id = ?
        ORDER BY created_at DESC
    ");
    $allProductsStmt->bind_param("i", $seller_id);
    $allProductsStmt->execute();
    $allProducts = [];
    $allResult = $allProductsStmt->get_result();
    while ($row = $allResult->fetch_assoc()) {
        $allProducts[] = $row;
    }
    $allProductsStmt->close();

    // ========== COUNT BY STATUS ==========
    $statusCount = [];
    foreach ($allProducts as $p) {
        $status = $p['status'] ?? 'NULL';
        $statusCount[$status] = ($statusCount[$status] ?? 0) + 1;
    }

    // ========== GET APPROVED PRODUCTS (detailed) ==========
    $approvedStmt = $conn->prepare("
        SELECT id, name, status, price, created_at, admin_feedback, reviewed_at
        FROM products
        WHERE seller_id = ? AND status = 'approved'
        ORDER BY created_at DESC
    ");
    $approvedStmt->bind_param("i", $seller_id);
    $approvedStmt->execute();
    $approvedProducts = [];
    $approvedResult = $approvedStmt->get_result();
    while ($row = $approvedResult->fetch_assoc()) {
        $approvedProducts[] = $row;
    }
    $approvedStmt->close();

    // ========== GET PENDING PRODUCTS ==========
    $pendingStmt = $conn->prepare("
        SELECT id, name, status, price, created_at, admin_feedback
        FROM products
        WHERE seller_id = ? AND (status = 'pending_review' OR status IS NULL OR status = '')
        ORDER BY created_at DESC
    ");
    $pendingStmt->bind_param("i", $seller_id);
    $pendingStmt->execute();
    $pendingProducts = [];
    $pendingResult = $pendingStmt->get_result();
    while ($row = $pendingResult->fetch_assoc()) {
        $pendingProducts[] = $row;
    }
    $pendingStmt->close();

    // ========== DB SCHEMA CHECK ==========
    $schemaCheck = $conn->query("DESCRIBE products");
    $columns = [];
    while ($row = $schemaCheck->fetch_assoc()) {
        if ($row['Field'] === 'seller_id' || $row['Field'] === 'status') {
            $columns[] = $row;
        }
    }

    echo json_encode([
        'success' => true,
        'debug' => [
            'current_user_id' => $user_id,
            'seller_id' => $seller_id,
            'seller_info' => $seller,
            'has_status_column' => $hasStatusColumn,
            'schema_info' => $columns,
            'timestamp' => date('Y-m-d H:i:s')
        ],
        'counts' => [
            'total_products' => count($allProducts),
            'approved' => count($approvedProducts),
            'pending_or_null' => count($pendingProducts),
            'by_status' => $statusCount
        ],
        'approved_products' => $approvedProducts,
        'pending_products' => $pendingProducts,
        'all_products' => $allProducts
    ]);

    $conn->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>
