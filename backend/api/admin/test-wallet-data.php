<?php
require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../payout/common.php';

header('Content-Type: application/json');

$conn = getDBConnection();
ensurePayoutTables($conn);

try {
    // Check for orders
    $result = $conn->query("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'");
    $orders = $result->fetch_assoc()['count'];
    
    // Check for seller_earnings
    $result = $conn->query("SELECT COUNT(*) as count FROM seller_earnings");
    $earnings = $result->fetch_assoc()['count'];
    
    // Check for sellers
    $result = $conn->query("SELECT COUNT(*) as count FROM sellers");
    $sellers = $result->fetch_assoc()['count'];
    
    // Get total revenue
    $result = $conn->query("SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status = 'completed'");
    $totalRevenue = $result->fetch_assoc()['total'];
    
    // Get total seller earnings
    $result = $conn->query("SELECT COALESCE(SUM(amount), 0) as total FROM seller_earnings WHERE status IN ('pending', 'paid')");
    $totalEarnings = $result->fetch_assoc()['total'];
    
    // Get admin wallet
    $stmt = $conn->prepare("SELECT balance FROM admin_wallet WHERE id = 1");
    $stmt->execute();
    $adminWallet = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    
    echo json_encode([
        "success" => true,
        "data" => [
            "completed_orders_count" => intval($orders),
            "total_revenue" => floatval($totalRevenue),
            "seller_earnings_records_count" => intval($earnings),
            "total_seller_earnings" => floatval($totalEarnings),
            "sellers_count" => intval($sellers),
            "admin_wallet_balance" => $adminWallet ? floatval($adminWallet['balance']) : 0,
            "calculated_commission" => floatval($totalRevenue) - floatval($totalEarnings)
        ]
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>
