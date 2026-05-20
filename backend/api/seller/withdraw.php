<?php

/**

* Seller Withdraw Request API

* POST: Create withdrawal request for authenticated seller

*/
 
error_reporting(E_ALL);

ini_set('display_errors', 0);
 
header('Access-Control-Allow-Origin: https://uptulathemehub.com');

header('Access-Control-Allow-Credentials: true');

header('Access-Control-Allow-Methods: POST, OPTIONS');

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
 
    $data = getRequestData();

    $amount = floatval($data['amount'] ?? 0);

    $note = trim($data['note'] ?? 'Seller withdraw request');
 
    if ($amount <= 0) {

        http_response_code(400);

        echo json_encode(['success' => false, 'message' => 'Invalid withdrawal amount']);

        exit;

    }
 
    if ($amount < SELLER_WITHDRAW_REQUEST_MIN) {

        http_response_code(400);

        echo json_encode(['success' => false, 'message' => 'Minimum withdrawal amount is ₹' . SELLER_WITHDRAW_REQUEST_MIN]);

        exit;

    }
 
    $sellerId = intval($seller['id']);

    $wallet = getSellerWallet($conn, $sellerId);
 
    if ($amount > $wallet['balance']) {

        http_response_code(400);

        echo json_encode(['success' => false, 'message' => 'Withdrawal amount cannot exceed available balance']);

        exit;

    }
 
    // Prevent duplicate pending requests

    $stmt = $conn->prepare("SELECT COUNT(*) AS pending_count FROM withdraw_requests WHERE seller_id = ? AND status = 'pending'");

    $stmt->bind_param('i', $sellerId);

    $stmt->execute();

    $existing = $stmt->get_result()->fetch_assoc();

    $stmt->close();
 
    if (intval($existing['pending_count'] ?? 0) > 0) {

        http_response_code(400);

        echo json_encode(['success' => false, 'message' => 'You already have a pending withdrawal request']);

        exit;

    }
 
    $sellerKyc = getSellerKyc($conn, $sellerId);

    if (!$sellerKyc || $sellerKyc['status'] !== 'verified') {

        http_response_code(400);

        echo json_encode(['success' => false, 'message' => 'Your KYC must be verified by admin before requesting a withdrawal']);

        exit;

    }

    $bankDetails = $sellerKyc['details'] ?? null;

    if (!$bankDetails || empty($bankDetails['account_number']) || empty($bankDetails['ifsc']) || empty($bankDetails['account_holder_name'])) {

        http_response_code(400);

        echo json_encode(['success' => false, 'message' => 'Complete your KYC bank details before requesting a withdrawal']);

        exit;

    }
 
    $bankDetailsJson = json_encode($bankDetails);

    $stmt = $conn->prepare("INSERT INTO withdraw_requests (seller_id, amount, currency, status, reason, bank_details, metadata) VALUES (?, ?, 'INR', 'pending', ?, ?, NULL)");

    $stmt->bind_param('idss', $sellerId, $amount, $note, $bankDetailsJson);

    $stmt->execute();

    $requestId = $conn->insert_id;

    $stmt->close();
 
    // FIX: correct parameter order → ($conn, $userId, $sellerId, $type, $title, $message)

    createNotification(

        $conn,

        null,

        $sellerId,

        'info',

        'Withdrawal Request Submitted',

        "Your withdrawal request for ₹{$amount} has been submitted and is pending admin approval."

    );
 
    echo json_encode(['success' => true, 'message' => 'Withdrawal request created', 'request_id' => $requestId]);

    $conn->close();
 
} catch (Exception $e) {

    http_response_code(500);

    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);

}
 