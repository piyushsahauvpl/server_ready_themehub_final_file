<?php
// Simulating an admin JWT token request to wallet-summary.php

require_once 'config/database.php';
require_once 'api/payout/common.php';
require_once 'config/jwt.php';

// Create test JWT token for admin
$adminPayload = [
    'id' => 1,
    'email' => 'admin@test.com',
    'role' => 'ADMIN'
];

$secretKey = getenv('JWT_SECRET') ?: 'your-secret-key';
$issuedAt = time();
$expire = $issuedAt + (60 * 60); // 1 hour

$header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
$payload = base64_encode(json_encode($adminPayload + ['iat' => $issuedAt, 'exp' => $expire]));
$signature = base64_encode(hash_hmac('sha256', "$header.$payload", $secretKey, true));
$token = "$header.$payload.$signature";

// Simulate the request
header('Content-Type: application/json');
echo json_encode([
    "admin_wallet_state" => [
        "message" => "Current state of admin and seller wallets",
        "query_results" => null
    ]
], JSON_PRETTY_PRINT);

// Actually query the database
$conn = getDBConnection();
ensurePayoutTables($conn);

$adminWallet = getAdminWallet($conn);

$stmt = $conn->prepare("SELECT COALESCE(SUM(balance), 0) as total_seller_balance FROM seller_wallet");
$stmt->execute();
$sellerBalanceRow = $stmt->get_result()->fetch_assoc();
$stmt->close();

$stmt = $conn->prepare("SELECT COUNT(*) as total_sellers FROM sellers");
$stmt->execute();
$totalSellersRow = $stmt->get_result()->fetch_assoc();
$stmt->close();

$stmt = $conn->prepare("SELECT COUNT(*) as pending_count, COALESCE(SUM(amount), 0) as pending_amount FROM seller_earnings WHERE status = 'pending'");
$stmt->execute();
$pendingRow = $stmt->get_result()->fetch_assoc();
$stmt->close();

$summary = [
    "admin_wallet_balance" => floatval($adminWallet['balance']),
    "total_seller_balances" => floatval($sellerBalanceRow['total_seller_balance']),
    "total_sellers" => intval($totalSellersRow['total_sellers']),
    "pending_earnings" => [
        "count" => intval($pendingRow['pending_count']),
        "total_amount" => floatval($pendingRow['pending_amount'])
    ],
    "summary" => [
        "total_platform_balance" => floatval($adminWallet['balance']) + floatval($sellerBalanceRow['total_seller_balance']),
        "admin_keeps_on_completion" => floatval($adminWallet['balance'])
    ]
];

echo json_encode($summary, JSON_PRETTY_PRINT);
?>
