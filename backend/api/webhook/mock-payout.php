<?php
/**
 * Mock payout webhook simulator
 * POST /backend/api/webhook/mock-payout.php
 * Updates payout status to "paid" for testing
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once '../../config/database.php';
require_once '../../api/payout/common.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    $conn = getDBConnection();
    ensurePayoutTables($conn);

    $input = json_decode(file_get_contents('php://input'), true);
    $payoutId = $input['payout_id'] ?? null;

    if (!$payoutId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'payout_id is required']);
        exit;
    }

    // Find the payout record
    $stmt = $conn->prepare("SELECT id, seller_id, amount, status FROM seller_payouts WHERE razorpay_payout_id = ? LIMIT 1");
    $stmt->bind_param('s', $payoutId);
    $stmt->execute();
    $payout = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$payout) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Payout record not found']);
        exit;
    }

    if ($payout['status'] !== 'processing') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Payout is not in processing status']);
        exit;
    }

    // Update payout to paid
    $responseJson = json_encode([
        'id' => $payoutId,
        'entity' => 'payout',
        'amount' => intval($payout['amount'] * 100),
        'currency' => 'INR',
        'status' => 'paid',
        'mode' => 'IMPS',
        'purpose' => 'payout',
        'created_at' => time(),
        'processed_at' => time(),
        'mock_webhook' => true
    ]);

    $stmt = $conn->prepare("UPDATE seller_payouts SET status = 'paid', response = ?, updated_at = NOW() WHERE id = ?");
    $stmt->bind_param('si', $responseJson, $payout['id']);
    $stmt->execute();
    $stmt->close();

    // Update withdraw_requests if applicable
    $stmt = $conn->prepare("UPDATE withdraw_requests SET status = 'paid', processed_at = NOW() WHERE payout_id = ?");
    $stmt->bind_param('s', $payoutId);
    $stmt->execute();
    $stmt->close();

    // Send notification
    createNotification($conn, null, intval($payout['seller_id']), 'success', 'Payout Processed', 'Your payout has been processed successfully (mock).');

    echo json_encode([
        'success' => true,
        'message' => 'Mock payout processed successfully',
        'payout_id' => $payoutId
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>