<?php
/**
 * Admin Wallet System - Comprehensive Test
 * This script tests all wallet functionality and data
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../payout/common.php';

$conn = getDBConnection();
ensurePayoutTables($conn);

try {
    $results = [
        "timestamp" => date('Y-m-d H:i:s'),
        "database_tables" => [],
        "data_summary" => [],
        "wallet_calculations" => [],
        "recommendations" => []
    ];

    // 1. Check if required tables exist
    $tables = ['orders', 'seller_earnings', 'sellers', 'admin_wallet', 'withdraw_requests'];
    foreach ($tables as $table) {
        $exists = $conn->query("SHOW TABLES LIKE '$table'");
        $results["database_tables"][$table] = $exists && $exists->num_rows > 0 ? "✓ Exists" : "✗ Missing";
    }

    // 2. Get data summary
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'");
    $stmt->execute();
    $results["data_summary"]["completed_orders"] = intval($stmt->get_result()->fetch_assoc()['count']);
    $stmt->close();

    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM sellers WHERE status = 'active'");
    $stmt->execute();
    $results["data_summary"]["active_sellers"] = intval($stmt->get_result()->fetch_assoc()['count']);
    $stmt->close();

    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM seller_earnings WHERE status IN ('pending', 'paid')");
    $stmt->execute();
    $results["data_summary"]["seller_earnings_records"] = intval($stmt->get_result()->fetch_assoc()['count']);
    $stmt->close();

    // 3. Get wallet calculations
    $stmt = $conn->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status = 'completed'");
    $stmt->execute();
    $totalRevenue = floatval($stmt->get_result()->fetch_assoc()['total']);
    $stmt->close();
    $results["wallet_calculations"]["total_platform_revenue"] = $totalRevenue;

    $stmt = $conn->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM seller_earnings WHERE status IN ('pending', 'paid')");
    $stmt->execute();
    $totalSellerEarnings = floatval($stmt->get_result()->fetch_assoc()['total']);
    $stmt->close();
    $results["wallet_calculations"]["total_seller_earnings"] = $totalSellerEarnings;

    $results["wallet_calculations"]["admin_commission"] = $totalRevenue - $totalSellerEarnings;

    $stmt = $conn->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM withdraw_requests WHERE status = 'paid'");
    $stmt->execute();
    $results["wallet_calculations"]["total_paid_withdrawals"] = floatval($stmt->get_result()->fetch_assoc()['total']);
    $stmt->close();

    $stmt = $conn->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM withdraw_requests WHERE status = 'pending'");
    $stmt->execute();
    $results["wallet_calculations"]["total_pending_withdrawals"] = floatval($stmt->get_result()->fetch_assoc()['total']);
    $stmt->close();

    // 4. Check admin wallet
    $stmt = $conn->prepare("SELECT balance FROM admin_wallet WHERE id = 1");
    $stmt->execute();
    $adminWallet = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    $results["wallet_calculations"]["admin_wallet_balance"] = $adminWallet ? floatval($adminWallet['balance']) : 0;

    // 5. Get sample seller earnings
    $stmt = $conn->prepare("
        SELECT se.seller_id, s.business_name, SUM(se.amount) as total_earnings, COUNT(se.id) as order_count
        FROM seller_earnings se
        LEFT JOIN sellers s ON se.seller_id = s.id
        WHERE se.status IN ('pending', 'paid')
        GROUP BY se.seller_id
        LIMIT 5
    ");
    $stmt->execute();
    $result = $stmt->get_result();
    $results["wallet_calculations"]["top_sellers_by_earnings"] = [];
    while ($row = $result->fetch_assoc()) {
        $results["wallet_calculations"]["top_sellers_by_earnings"][] = [
            "seller_id" => intval($row['seller_id']),
            "business_name" => $row['business_name'] ?: 'Unnamed',
            "total_earnings" => floatval($row['total_earnings']),
            "order_count" => intval($row['order_count'])
        ];
    }
    $stmt->close();

    // 6. Recommendations
    if ($results["data_summary"]["completed_orders"] === 0) {
        $results["recommendations"][] = "No completed orders found. Create test orders to populate wallet data.";
    }
    if ($results["wallet_calculations"]["total_seller_earnings"] === 0) {
        $results["recommendations"][] = "No seller earnings found. Check if seller_earnings records are being created when orders are completed.";
    }
    if ($results["database_tables"]["seller_earnings"] === "✗ Missing") {
        $results["recommendations"][] = "Run marketplace_enhancements.sql to create seller_earnings table.";
    }
    if (empty($results["wallet_calculations"]["top_sellers_by_earnings"])) {
        $results["recommendations"][] = "No seller earnings data available. Ensure products have seller_id assigned.";
    }

    echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage(),
        "trace" => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}
?>
