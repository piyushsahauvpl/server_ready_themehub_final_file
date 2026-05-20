<?php
/**
 * SELLER - View Earnings & Payout History
 * Shows seller their pending earnings and all past payouts
 * 
 * GET /seller/view-payouts.php - View earnings and payout history
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

// CORS Headers
header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../config/database.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized - Please login'
    ]);
    exit;
}

try {
    $conn = getDBConnection();
    $userId = $_SESSION['user_id'];

    error_log("🔍 [SELLER-PAYOUTS] Fetching for user_id: $userId");

    // ✅ STEP 1: Get seller info
    $sellerStmt = $conn->prepare("
        SELECT id, business_name, total_earnings, pending_earnings 
        FROM sellers 
        WHERE user_id = ?
    ");
    $sellerStmt->bind_param("i", $userId);
    $sellerStmt->execute();
    $seller = $sellerStmt->get_result()->fetch_assoc();
    $sellerStmt->close();

    if (!$seller) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'You are not registered as a seller'
        ]);
        exit;
    }

    $sellerId = $seller['id'];

    error_log("✅ [SELLER-PAYOUTS] Seller found: {$seller['business_name']}");

    // ✅ STEP 2: Get pending earnings breakdown
    $pendingStmt = $conn->prepare("
        SELECT 
            COUNT(*) as count,
            SUM(amount) as total
        FROM seller_earnings 
        WHERE seller_id = ? AND status = 'pending'
    ");
    $pendingStmt->bind_param("i", $sellerId);
    $pendingStmt->execute();
    $pending = $pendingStmt->get_result()->fetch_assoc();
    $pendingStmt->close();

    error_log("📋 [SELLER-PAYOUTS] Pending earnings: " . $pending['total']);

    // ✅ STEP 3: Get paid earnings breakdown
    $paidStmt = $conn->prepare("
        SELECT 
            COUNT(*) as count,
            SUM(amount) as total
        FROM seller_earnings 
        WHERE seller_id = ? AND status = 'paid'
    ");
    $paidStmt->bind_param("i", $sellerId);
    $paidStmt->execute();
    $paid = $paidStmt->get_result()->fetch_assoc();
    $paidStmt->close();

    error_log("✅ [SELLER-PAYOUTS] Paid earnings: " . $paid['total']);

    // ✅ STEP 4: Get recent earnings entries
    $earningsStmt = $conn->prepare("
        SELECT 
            se.id,
            se.order_id,
            se.amount,
            se.status,
            se.created_at,
            se.paid_at,
            p.name as product_name,
            o.user_id as buyer_id,
            u.full_name as buyer_name
        FROM seller_earnings se
        LEFT JOIN orders o ON se.order_id = o.id
        LEFT JOIN products p ON o.product_id = p.id
        LEFT JOIN users u ON o.user_id = u.id
        WHERE se.seller_id = ?
        ORDER BY se.created_at DESC
        LIMIT 50
    ");
    $earningsStmt->bind_param("i", $sellerId);
    $earningsStmt->execute();
    $earningsResult = $earningsStmt->get_result();
    
    $earnings = [];
    while ($row = $earningsResult->fetch_assoc()) {
        $earnings[] = [
            'id' => $row['id'],
            'order_id' => $row['order_id'],
            'product_name' => $row['product_name'],
            'buyer_name' => $row['buyer_name'],
            'amount' => floatval($row['amount']),
            'status' => $row['status'],
            'earned_at' => $row['created_at'],
            'paid_at' => $row['paid_at']
        ];
    }
    $earningsStmt->close();

    error_log("📊 [SELLER-PAYOUTS] Retrieved " . count($earnings) . " earnings entries");

    // ✅ STEP 5: Get payout history (if seller_payouts table exists)
    $payouts = [];
    if (tableExists($conn, 'seller_payouts')) {
        $payoutsStmt = $conn->prepare("
            SELECT 
                id,
                amount,
                method,
                status,
                created_at,
                transferred_at,
                notes
            FROM seller_payouts 
            WHERE seller_id = ?
            ORDER BY created_at DESC
            LIMIT 20
        ");
        $payoutsStmt->bind_param("i", $sellerId);
        $payoutsStmt->execute();
        $payoutsResult = $payoutsStmt->get_result();
        
        while ($row = $payoutsResult->fetch_assoc()) {
            $payouts[] = [
                'id' => $row['id'],
                'amount' => floatval($row['amount']),
                'method' => $row['method'],
                'status' => $row['status'],
                'created_at' => $row['created_at'],
                'transferred_at' => $row['transferred_at'],
                'notes' => $row['notes']
            ];
        }
        $payoutsStmt->close();
    }

    error_log("📤 [SELLER-PAYOUTS] Payout history count: " . count($payouts));

    // ✅ RESPONSE
    echo json_encode([
        'success' => true,
        'seller' => [
            'seller_id' => $seller['id'],
            'business_name' => $seller['business_name'],
            'total_earnings' => floatval($seller['total_earnings']),
            'pending_earnings' => floatval($seller['pending_earnings'])
        ],
        'earnings_summary' => [
            'pending' => [
                'count' => intval($pending['count'] ?? 0),
                'total' => floatval($pending['total'] ?? 0)
            ],
            'paid' => [
                'count' => intval($paid['count'] ?? 0),
                'total' => floatval($paid['total'] ?? 0)
            ]
        ],
        'recent_earnings' => $earnings,
        'payout_history' => $payouts,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    $conn->close();

} catch (Exception $e) {
    error_log('❌ [SELLER-PAYOUTS] Error: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

function tableExists($conn, $tableName) {
    $result = $conn->query("SHOW TABLES LIKE '$tableName'");
    return $result && $result->num_rows > 0;
}
?>
