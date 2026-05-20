<?php
require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/jwt.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../payout/common.php';

header('Content-Type: application/json; charset=utf-8');

require_jwt(['ADMIN']);

// CORS
header("Access-Control-Allow-Origin: https://uptulathemehub.com");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$conn = getDBConnection();
ensurePayoutTables($conn);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $wallet = getAdminWallet($conn);

    // Get recent transactions
    $stmt = $conn->prepare("
        SELECT type, amount, balance_after, reference_type, reference_id, note, created_at
        FROM admin_wallet_transactions
        ORDER BY created_at DESC
        LIMIT 50
    ");
    $stmt->execute();
    $result = $stmt->get_result();
    $transactions = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    // Get earnings summary
    $stmt = $conn->prepare("
        SELECT
            COUNT(*) as total_orders,
            COALESCE(SUM(amount), 0) as total_earnings,
            COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_earnings,
            COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid_earnings
        FROM seller_earnings
    ");
    $stmt->execute();
    $earningsSummary = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    echo json_encode([
        "success" => true,
        "wallet" => $wallet,
        "transactions" => $transactions,
        "earnings_summary" => $earningsSummary
    ]);
    exit;
}

echo json_encode(["success" => false, "message" => "Method not allowed"]);
?>