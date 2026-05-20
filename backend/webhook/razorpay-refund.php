<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');

require_once '../config/database.php';
require_once '../config/razorpay.php';

/**
 * Razorpay Refund Webhook Handler
 * This endpoint handles webhooks from Razorpay for refund status updates
 * 
 * Webhook Events:
 * - refund.created: Refund has been created
 * - refund.failed: Refund has failed
 * - refund.processed: Refund has been processed
 */

$conn = getDBConnection();

// Get webhook data from Razorpay
$webhookBody = file_get_contents('php://input');
$webhookData = json_decode($webhookBody, true);

error_log("Razorpay Webhook received: " . print_r($webhookData, true));

// Verify webhook signature (important for security)
$webhookSignature = $_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? '';
$expectedSignature = hash_hmac('sha256', $webhookBody, RAZORPAY_WEBHOOK_SECRET);

if ($webhookSignature !== $expectedSignature) {
    error_log("Invalid webhook signature");
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid signature']);
    exit;
}

// Extract event data
$event = $webhookData['event'] ?? null;
$payload = $webhookData['payload'] ?? [];

if (!$event) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No event provided']);
    exit;
}

$refundData = $payload['refund'] ?? [];
$razorpayRefundId = $refundData['id'] ?? null;
$refundStatus = $refundData['status'] ?? null;

if (!$razorpayRefundId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No refund ID']);
    exit;
}

// Find refund by Razorpay refund ID
$stmt = $conn->prepare("
    SELECT id, seller_id, amount, order_id
    FROM refunds
    WHERE razorpay_refund_id = ?
");

$stmt->bind_param("s", $razorpayRefundId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    error_log("Refund not found for Razorpay ID: $razorpayRefundId");
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Refund not found']);
    exit;
}

$refund = $result->fetch_assoc();
$refundId = $refund['id'];

// Handle different webhook events
switch ($event) {
    case 'refund.created':
        // Refund has been created but not processed yet
        error_log("Refund created: $razorpayRefundId");
        break;

    case 'refund.failed':
        // Refund failed - mark in database
        error_log("Refund failed: $razorpayRefundId");
        
        $failureReason = $refundData['failure_reason'] ?? 'Unknown error';
        $failureNote = "Razorpay refund failed: " . $failureReason;

        $stmt = $conn->prepare("
            UPDATE refunds
            SET status = 'rejected', admin_notes = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->bind_param("si", $failureNote, $refundId);
        $stmt->execute();

        // Reverse the seller earnings deduction if already deducted
        $stmt = $conn->prepare("
            SELECT SUM(amount) as total_deducted
            FROM seller_earnings_transactions
            WHERE refund_id = ? AND transaction_type = 'deduction'
        ");
        $stmt->bind_param("i", $refundId);
        $stmt->execute();
        $deductionResult = $stmt->get_result()->fetch_assoc();

        if ($deductionResult['total_deducted'] > 0) {
            // Reverse deduction
            $reversalAmount = $deductionResult['total_deducted'];
            $stmt = $conn->prepare("
                UPDATE seller_wallet
                SET balance = balance + ?
                WHERE seller_id = ?
            ");
            $stmt->bind_param("di", $reversalAmount, $refund['seller_id']);
            $stmt->execute();

            // Log reversal transaction
            $transactionType = 'adjustment';
            $description = "Refund reversal for failed refund #" . $refundId;
            $stmt = $conn->prepare("
                INSERT INTO seller_earnings_transactions (seller_id, refund_id, amount, transaction_type, description)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->bind_param("iidss", $refund['seller_id'], $refundId, $reversalAmount, $transactionType, $description);
            $stmt->execute();

            error_log("Seller earnings reversed: " . $reversalAmount . " for seller: " . $refund['seller_id']);
        }
        break;

    case 'refund.processed':
        // Refund has been processed - mark as refunded
        error_log("Refund processed: $razorpayRefundId");
        
        $newStatus = 'refunded';
        $stmt = $conn->prepare("
            UPDATE refunds
            SET status = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->bind_param("si", $newStatus, $refundId);
        $stmt->execute();

        // Optional: Send notification to user
        // sendNotification($refund['user_id'], "Your refund of ₹" . $refund['amount'] . " has been processed successfully.");

        error_log("Refund marked as processed: $refundId");
        break;
}

http_response_code(200);
echo json_encode(['success' => true, 'message' => 'Webhook processed successfully']);
