<?php
/**
 * Razorpay payout webhook handler
 * handles payout.processed and payout.failed events
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once '../../config/database.php';
require_once '../../config/razorpay.php';
require_once '../../api/payout/common.php';

header('Content-Type: application/json; charset=utf-8');

$rawBody = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? $_SERVER['HTTP_X-Razorpay-Signature'] ?? '';

if (empty($signature) || empty(RAZORPAY_WEBHOOK_SECRET)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid webhook signature']);
    exit;
}

$expectedSignature = hash_hmac('sha256', $rawBody, RAZORPAY_WEBHOOK_SECRET);
if (!hash_equals($expectedSignature, $signature)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Signature mismatch']);
    exit;
}

$payload = json_decode($rawBody, true);
if (!$payload || empty($payload['event'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid webhook payload']);
    exit;
}

try {
    $conn = getDBConnection();
    ensurePayoutTables($conn);

    $event = $payload['event'];
    $entity = $payload['payload']['payout']['entity'] ?? $payload['payload']['transfer']['entity'] ?? null;

    if (!$entity) {
        throw new Exception('Unsupported webhook payload structure');
    }

    $remotePayoutId = $entity['id'] ?? null;
    $status = $entity['status'] ?? null;
    $failureReason = $entity['failure_reason'] ?? ($entity['failure_code'] ?? null);
    $amount = isset($entity['amount']) ? floatval($entity['amount']) / 100 : 0.0;

    if (!$remotePayoutId || !$status) {
        throw new Exception('Missing payout id or status from webhook');
    }

    $stmt = $conn->prepare("SELECT id, seller_id, amount, status FROM seller_payouts WHERE razorpay_payout_id = ? LIMIT 1");
    $stmt->bind_param('s', $remotePayoutId);
    $stmt->execute();
    $payout = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$payout) {
        throw new Exception('Payout record not found for id: ' . $remotePayoutId);
    }

    if ($event === 'payout.processed') {
        $newStatus = 'paid';
    } elseif ($event === 'payout.failed') {
        $newStatus = 'failed';
    } else {
        echo json_encode(['success' => true, 'message' => 'Event ignored']);
        exit;
    }

    $stmt = $conn->prepare("UPDATE seller_payouts SET status = ?, failure_reason = ?, response = ?, updated_at = NOW() WHERE id = ?");
    $responseJson = json_encode($entity);
    $stmt->bind_param('sssi', $newStatus, $failureReason, $responseJson, $payout['id']);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare("UPDATE withdraw_requests SET status = ?, failure_reason = ?, processed_at = NOW() WHERE payout_id = ?");
    $stmt->bind_param('sss', $newStatus, $failureReason, $remotePayoutId);
    $stmt->execute();
    $stmt->close();

    if ($newStatus === 'failed') {
        $sellerId = intval($payout['seller_id']);
        $wallet = getSellerWallet($conn, $sellerId);
        if ($amount > 0) {
            updateSellerWalletBalance($conn, $sellerId, $amount, 'credit');
        }
        createNotification($conn, null, $sellerId, 'error', 'Payout Failed', 'Payout failed: ' . ($failureReason ?: 'unknown reason'));
    } else {
        createNotification($conn, null, intval($payout['seller_id']), 'success', 'Payout Processed', 'Payout processed successfully.');
    }

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
