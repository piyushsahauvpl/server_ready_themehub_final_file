<?php
require_once 'config/database.php';
require_once 'api/payout/common.php';

header('Content-Type: application/json');

$conn = getDBConnection();
ensurePayoutTables($conn);

// Check admin_wallet table
$stmt = $conn->prepare("SELECT * FROM admin_wallet LIMIT 5");
$stmt->execute();
$adminWalletResult = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// Check admin_wallet_transactions table
$stmt = $conn->prepare("SELECT * FROM admin_wallet_transactions ORDER BY created_at DESC LIMIT 10");
$stmt->execute();
$transactionsResult = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// Check orders with amounts
$stmt = $conn->prepare("SELECT id, user_id, product_id, amount, status, created_at FROM orders ORDER BY created_at DESC LIMIT 10");
$stmt->execute();
$ordersResult = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// Check seller_earnings
$stmt = $conn->prepare("SELECT id, seller_id, order_id, amount, status, created_at FROM seller_earnings ORDER BY created_at DESC LIMIT 10");
$stmt->execute();
$earningsResult = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// Check seller_wallet
$stmt = $conn->prepare("SELECT id, seller_id, balance, updated_at FROM seller_wallet LIMIT 10");
$stmt->execute();
$sellerWalletResult = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

echo json_encode([
    "success" => true,
    "admin_wallet" => $adminWalletResult,
    "transactions" => $transactionsResult,
    "orders" => $ordersResult,
    "seller_earnings" => $earningsResult,
    "seller_wallet" => $sellerWalletResult,
    "summary" => [
        "admin_balance" => !empty($adminWalletResult) ? floatval($adminWalletResult[0]['balance']) : 0,
        "total_orders" => count($ordersResult),
        "total_seller_earnings_pending" => count(array_filter($earningsResult, fn($e) => $e['status'] === 'pending')),
        "total_seller_earnings_paid" => count(array_filter($earningsResult, fn($e) => $e['status'] === 'paid')),
    ]
], JSON_PRETTY_PRINT);
?>
