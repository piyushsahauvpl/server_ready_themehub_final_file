<?php
/**
 * Seller Approved Products Count API
 * GET: Fetch count of approved products for authenticated seller
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
    echo json_encode(['success' => false, 'message' => 'Unauthorized - Please login']);
    exit;
}

try {
    $conn = getDBConnection();
    $user_id = $_SESSION['user_id'];

    error_log("🔍 [approved-products.php] Fetching for user_id: $user_id");

    // ✅ STEP 1: Verify products table has status column
    $columnsResult = $conn->query("SHOW COLUMNS FROM products LIKE 'status'");
    
    if ($columnsResult->num_rows === 0) {
        // Status column doesn't exist - need to add it
        error_log("⚠️ [approved-products.php] Status column missing! Creating it...");
        
        $conn->query("ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending_review'");
        $conn->query("ALTER TABLE products ADD INDEX IF NOT EXISTS idx_status (status)");
        
        error_log("✅ [approved-products.php] Status column created");
    }

    // ✅ STEP 2: Get seller info for this user
    $stmt = $conn->prepare("
        SELECT id, user_id, payment_confirmed FROM sellers 
        WHERE user_id = ?
    ");
    
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $seller = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    error_log("🔍 [approved-products.php] Seller lookup result: " . json_encode($seller));

    if (!$seller) {
        // User is not a seller at all
        error_log("⚠️ [approved-products.php] User $user_id is not a seller");
        
        echo json_encode([
            'success' => true,
            'approved_count' => 0,
            'total_count' => 0,
            'is_seller' => false,
            'message' => 'User is not a seller'
        ]);
        $conn->close();
        exit;
    }

    $seller_id = $seller['id'];

    // ✅ STEP 3: Get count of approved products
    $stmt = $conn->prepare("
        SELECT COUNT(*) as approved_count 
        FROM products 
        WHERE seller_id = ? AND status = 'approved'
    ");

    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $stmt->bind_param("i", $seller_id);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $approvedCount = intval($result['approved_count'] ?? 0);

    error_log("✅ [approved-products.php] Approved count for seller_id $seller_id: $approvedCount");

    // ✅ STEP 4: Get total count and breakdown
    $statStmt = $conn->prepare("
        SELECT 
            COUNT(*) as total_count,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status = 'pending_review' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
            SUM(CASE WHEN status = 'needs_changes' THEN 1 ELSE 0 END) as needs_changes
        FROM products 
        WHERE seller_id = ?
    ");

    if (!$statStmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $statStmt->bind_param("i", $seller_id);
    $statStmt->execute();
    $statsResult = $statStmt->get_result()->fetch_assoc();
    $statStmt->close();

    $response = [
        'success' => true,
        'approved_count' => $approvedCount,
        'total_count' => intval($statsResult['total_count'] ?? 0),
        'is_seller' => true,
        'seller_id' => $seller_id,
        'status_breakdown' => [
            'approved' => intval($statsResult['approved'] ?? 0),
            'pending_review' => intval($statsResult['pending'] ?? 0),
            'rejected' => intval($statsResult['rejected'] ?? 0),
            'needs_changes' => intval($statsResult['needs_changes'] ?? 0)
        ]
    ];

    error_log("📤 [approved-products.php] Response: " . json_encode($response));

    echo json_encode($response);

    $conn->close();

} catch (Exception $e) {
    error_log('❌ [approved-products.php] Error: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching approved products count',
        'error' => $e->getMessage()
    ]);
}
?>

