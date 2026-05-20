<?php
/**
 * Auto payout script for sellers.
 * Run daily via cron or Windows Task Scheduler.
 * Example: php backend/cron/auto-payout.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/razorpay.php';
require_once __DIR__ . '/../api/payout/common.php';

function logLine($message) {
    echo '[' . date('Y-m-d H:i:s') . '] ' . $message . PHP_EOL;
}

try {
    $conn = getDBConnection();
    ensurePayoutTables($conn);
    logLine('Starting scheduled auto-payout run');

    $threshold = SELLER_MINIMUM_PAYOUT;
    $sql = "
        SELECT sw.seller_id, sw.balance, s.business_name, u.full_name, u.email, u.phone
        FROM seller_wallet sw
        JOIN sellers s ON sw.seller_id = s.id
        JOIN seller_kyc k ON k.seller_id = sw.seller_id AND k.status = 'verified'
        LEFT JOIN users u ON s.user_id = u.id
        WHERE sw.balance >= ?
    ";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('d', $threshold);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($seller = $result->fetch_assoc()) {
        $sellerId = intval($seller['seller_id']);
        $balance = floatval($seller['balance']);
        logLine('Processing auto-payout for seller_id=' . $sellerId . ' balance=₹' . number_format($balance, 2));

        $stmt2 = $conn->prepare("SELECT COUNT(*) AS pending_count FROM withdraw_requests WHERE seller_id = ? AND status = 'pending'");
        $stmt2->bind_param('i', $sellerId);
        $stmt2->execute();
        $pending = $stmt2->get_result()->fetch_assoc();
        $stmt2->close();

        if (intval($pending['pending_count'] ?? 0) > 0) {
            logLine('  Skipping: existing pending withdraw request');
            continue;
        }

        $kyc = getSellerKyc($conn, $sellerId);
        $bankDetails = $kyc['details'] ?? null;
        if (!$bankDetails || empty($bankDetails['account_number']) || empty($bankDetails['ifsc'])) {
            logLine('  Skipping: missing bank details');
            continue;
        }

        $stmtCreate = $conn->prepare("INSERT INTO withdraw_requests (seller_id, amount, currency, status, bank_details, metadata) VALUES (?, ?, 'INR', 'pending', ?, NULL)");
        $bankJson = json_encode($bankDetails);
        $stmtCreate->bind_param('ids', $sellerId, $balance, $bankJson);
        $stmtCreate->execute();
        $requestId = $conn->insert_id;
        $stmtCreate->close();

        logLine('  Created withdraw request #' . $requestId);

        try {
            $sellerData = [
                'id' => $sellerId,
                'business_name' => $seller['business_name'],
                'user_email' => $seller['email'],
                'user_phone' => $seller['phone']
            ];
            $response = createRazorpayPayout($sellerData, $bankDetails, $balance, $requestId);
            $remotePayoutId = $response['id'] ?? null;
            $responseJson = json_encode($response);

            $stmtUpdate = $conn->prepare("UPDATE withdraw_requests SET status = 'paid', processed_at = NOW(), payout_id = ? WHERE id = ?");
            $stmtUpdate->bind_param('si', $remotePayoutId, $requestId);
            $stmtUpdate->execute();
            $stmtUpdate->close();

            $stmtPayout = $conn->prepare("INSERT INTO seller_payouts (seller_id, withdraw_request_id, razorpay_payout_id, status, amount, response) VALUES (?, ?, ?, 'paid', ?, ?)");
            $stmtPayout->bind_param('iids', $sellerId, $requestId, $remotePayoutId, $balance, $responseJson);
            $stmtPayout->execute();
            $stmtPayout->close();

            updateSellerWalletBalance($conn, $sellerId, $balance, 'debit');
            createNotification($conn, null, $sellerId, 'success', 'Auto Payout Paid', 'Auto payout of ₹' . number_format($balance, 2) . ' has been sent.');
            logLine('  Auto-payout completed successfully');
        } catch (Exception $e) {
            $errorMessage = $e->getMessage();
            logLine('  Auto-payout failed: ' . $errorMessage);
            $stmtUpdate = $conn->prepare("UPDATE withdraw_requests SET status = 'failed', processed_at = NOW(), failure_reason = ? WHERE id = ?");
            $stmtUpdate->bind_param('si', $errorMessage, $requestId);
            $stmtUpdate->execute();
            $stmtUpdate->close();
            createNotification($conn, null, $sellerId, 'error', 'Auto Payout Failed', 'Auto payout failed: ' . $errorMessage);
        }
    }

    logLine('Auto-payout run complete');
    $conn->close();
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage() . PHP_EOL;
}
