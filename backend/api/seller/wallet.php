<?php

/**

* Seller Wallet API

* GET: fetch seller wallet, transactions, withdraw history, KYC status and notifications

*/
 
error_reporting(E_ALL);

ini_set('display_errors', 0);
 
header('Access-Control-Allow-Origin: https://uptulathemehub.com');

header('Access-Control-Allow-Credentials: true');

header('Access-Control-Allow-Methods: GET, OPTIONS');

header('Access-Control-Allow-Headers: Content-Type, Authorization');

header('Content-Type: application/json; charset=utf-8');
 
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {

    http_response_code(200);

    exit;

}
 
require_once __DIR__ . '/../payout/common.php';
 
try {

    $conn = getDBConnection();

    ensurePayoutTables($conn);

    $seller = getSellerSession($conn);
 
    if (!$seller) {

        http_response_code(401);

        echo json_encode(['success' => false, 'message' => 'Unauthorized - Please login as seller']);

        exit;

    }
 
    $sellerId = intval($seller['id']);

    $wallet = getSellerWallet($conn, $sellerId);
 
    // FIX: Re-fetch seller row directly so total_earnings & pending_earnings

    // are always up-to-date (getSellerSession may return a cached/stale value)

    $stmt = $conn->prepare("SELECT total_earnings, pending_earnings FROM sellers WHERE id = ? LIMIT 1");

    $stmt->bind_param('i', $sellerId);

    $stmt->execute();

    $sellerRow = $stmt->get_result()->fetch_assoc();

    $stmt->close();
 
    $totalEarnings   = floatval($sellerRow['total_earnings']   ?? 0);

    $pendingEarnings = floatval($sellerRow['pending_earnings'] ?? 0);
 
    $transactions = [];

    $stmt = $conn->prepare("SELECT id, type, amount, balance_after, reference_type, reference_id, note, created_at FROM wallet_transactions WHERE seller_id = ? ORDER BY created_at DESC LIMIT 50");

    $stmt->bind_param('i', $sellerId);

    $stmt->execute();

    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {

        $row['amount']        = floatval($row['amount']);

        $row['balance_after'] = floatval($row['balance_after']);

        $transactions[] = $row;

    }

    $stmt->close();
 
    $withdrawRequests = [];

    $stmt = $conn->prepare("SELECT id, amount, currency, status, requested_at, processed_at, payout_id, failure_reason, reason FROM withdraw_requests WHERE seller_id = ? ORDER BY requested_at DESC LIMIT 20");

    $stmt->bind_param('i', $sellerId);

    $stmt->execute();

    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {

        $row['amount'] = floatval($row['amount']);

        $withdrawRequests[] = $row;

    }

    $stmt->close();
 
    $kyc           = getSellerKyc($conn, $sellerId);

    $notifications = getNotifications($conn, $sellerId, 20);
 
    echo json_encode([

        'success' => true,

        'wallet'  => [

            'balance'          => floatval($wallet['balance']),

            'available_balance'=> floatval($wallet['balance']),

            'total_earnings'   => $totalEarnings,    // now always fresh from DB

            'pending_earnings' => $pendingEarnings,  // now always fresh from DB

        ],

        'transactions'     => $transactions,

        'withdraw_requests'=> $withdrawRequests,

        'kyc'              => $kyc,

        'notifications'    => $notifications,

    ]);

    $conn->close();
 
} catch (Exception $e) {

    http_response_code(500);

    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);

}
 