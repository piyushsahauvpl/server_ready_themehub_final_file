<?php
/**
 * Admin Withdraw Requests API
 * GET: list seller withdraw requests
 * POST?action=approve|reject: process a withdraw request
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../api/payout/common.php';
require_once '../../middleware/auth.php';

try {
    $payload = require_jwt(['ADMIN']);
    $adminId = intval($payload['id']);
    $conn = getDBConnection();
    ensurePayoutTables($conn);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $query = "
            SELECT r.*, s.business_name, u.full_name, u.email, u.phone,
                   sw.balance AS wallet_balance, k.status AS kyc_status
            FROM withdraw_requests r
            JOIN sellers s ON r.seller_id = s.id
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN seller_wallet sw ON sw.seller_id = s.id
            LEFT JOIN seller_kyc k ON k.seller_id = s.id
            ORDER BY r.created_at DESC
        ";
        $result = $conn->query($query);
        if (!$result) {
            throw new Exception('Query failed: ' . $conn->error);
        }

        $requests = [];
        while ($row = $result->fetch_assoc()) {
            $row['amount'] = floatval($row['amount']);
            $row['wallet_balance'] = floatval($row['wallet_balance'] ?? 0);
            $requests[] = $row;
        }

        echo json_encode(['success' => true, 'requests' => $requests]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = strtolower(trim($_GET['action'] ?? ''));
        $data = getRequestData();
        $requestId = intval($data['request_id'] ?? 0);
        $reason = trim($data['reason'] ?? '');

        if (!$requestId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'request_id is required']);
            exit;
        }

        $stmt = $conn->prepare("SELECT r.*, s.user_id, s.business_name, u.email AS user_email, u.phone AS user_phone FROM withdraw_requests r JOIN sellers s ON r.seller_id = s.id LEFT JOIN users u ON s.user_id = u.id WHERE r.id = ? LIMIT 1");
        $stmt->bind_param('i', $requestId);
        $stmt->execute();
        $request = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$request) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Withdraw request not found']);
            exit;
        }

        if ($request['status'] !== 'pending') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Only pending requests can be processed']);
            exit;
        }

        $sellerId = intval($request['seller_id']);
        $amount = floatval($request['amount']);

        if ($action === 'reject') {
            $stmt = $conn->prepare("UPDATE withdraw_requests SET status = 'rejected', processed_at = NOW(), admin_id = ?, reason = ? WHERE id = ?");
            $stmt->bind_param('isi', $adminId, $reason, $requestId);
            $stmt->execute();
            $stmt->close();

            createNotification($conn, null, $sellerId, 'warning', 'Withdrawal Rejected', 'Your withdrawal request has been rejected. Reason: ' . ($reason ?: 'No reason provided'));
            echo json_encode(['success' => true, 'message' => 'Withdraw request rejected']);
            exit;
        }

        if ($action !== 'approve') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            exit;
        }

        $kyc = requireVerifiedKyc($conn, $sellerId);
        $bankDetails = $kyc['details'] ?? null;
        if (!$bankDetails || empty($bankDetails['account_number']) || empty($bankDetails['ifsc'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Seller bank details are missing or incomplete']);
            exit;
        }

        $payoutId = null;
        try {
            $wallet = getSellerWallet($conn, $sellerId);
            if ($wallet['balance'] < $amount) {
                throw new Exception('Insufficient wallet balance to complete payout');
            }

            $sellerData = [
                'id' => $sellerId,
                'business_name' => $request['business_name'],
                'user_email' => $request['user_email'],
                'user_phone' => $request['user_phone']
            ];

            $result = initiateRazorpayPayoutProcessing($conn, $sellerData, $bankDetails, $amount, $requestId);
            $remotePayoutId = $result['payout_id'];
            $response = $result['response'];

            $stmt = $conn->prepare("UPDATE withdraw_requests SET status = 'approved', processed_at = NOW(), admin_id = ?, payout_id = ? WHERE id = ?");
            $stmt->bind_param('isi', $adminId, $remotePayoutId, $requestId);
            $stmt->execute();
            $stmt->close();

            updateSellerWalletBalance($conn, $sellerId, $amount, 'debit');

            createNotification($conn, null, $sellerId, 'info', 'Payout Initiated', 'Your payout of ₹' . number_format($amount, 2) . ' has been initiated and is processing.');

            echo json_encode(['success' => true, 'message' => 'Withdraw request approved and payout is processing', 'payout' => $response]);
            exit;
        } catch (Exception $e) {
            $failureReason = $e->getMessage();
            $stmt = $conn->prepare("UPDATE withdraw_requests SET status = 'failed', processed_at = NOW(), admin_id = ?, failure_reason = ? WHERE id = ?");
            $stmt->bind_param('isi', $adminId, $failureReason, $requestId);
            $stmt->execute();
            $stmt->close();

            if (!empty($payoutId)) {
                $stmt = $conn->prepare("UPDATE seller_payouts SET status = 'failed', failure_reason = ?, response = ? WHERE id = ?");
                $respJson = json_encode(['error' => $failureReason]);
                $stmt->bind_param('ssi', $failureReason, $respJson, $payoutId);
                $stmt->execute();
                $stmt->close();
            }

            createNotification($conn, null, $sellerId, 'error', 'Payout Failed', 'Payout failed: ' . $failureReason);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Payout failed: ' . $failureReason]);
            exit;
        }
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
