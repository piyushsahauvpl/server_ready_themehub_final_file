<?php
/**
 * Admin Seller KYC API
 * GET: list seller KYC records or fetch one seller's KYC details
 * POST?action=approve|reject: admin verify or reject seller KYC
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

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/jwt.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../payout/common.php';

try {
    $payload = require_jwt(['ADMIN']);
    $adminId = intval($payload['id']);

    $conn = getDBConnection();
    ensurePayoutTables($conn);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $sellerId = isset($_GET['seller_id']) ? intval($_GET['seller_id']) : 0;

        $baseQuery = "
            SELECT
                s.id AS seller_id,
                s.business_name,
                u.full_name AS seller_name,
                u.email,
                u.phone,
                COALESCE(sw.balance, 0) AS wallet_balance,
                COALESCE(kyc.status, 'not_submitted') AS kyc_status,
                kyc.details,
                kyc.verified_at,
                kyc.updated_at
            FROM sellers s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN seller_wallet sw ON s.id = sw.seller_id
            LEFT JOIN seller_kyc kyc ON s.id = kyc.seller_id
        ";

        if ($sellerId > 0) {
            $stmt = $conn->prepare($baseQuery . " WHERE s.id = ? LIMIT 1");
            $stmt->bind_param('i', $sellerId);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if (!$row) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Seller not found']);
                exit;
            }

            $row['wallet_balance'] = floatval($row['wallet_balance']);
            $row['details'] = $row['details'] ? json_decode($row['details'], true) : null;

            echo json_encode(['success' => true, 'seller' => $row]);
            exit;
        }

        $query = $baseQuery . " ORDER BY s.created_at DESC";
        $result = $conn->query($query);

        if (!$result) {
            throw new Exception('Query failed: ' . $conn->error);
        }

        $rows = [];
        while ($row = $result->fetch_assoc()) {
            $row['wallet_balance'] = floatval($row['wallet_balance']);
            $row['details'] = $row['details'] ? json_decode($row['details'], true) : null;
            $rows[] = $row;
        }

        echo json_encode(['success' => true, 'records' => $rows]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = strtolower(trim($_GET['action'] ?? ''));
        $data = getRequestData();
        $sellerId = intval($data['seller_id'] ?? 0);
        $reason = trim($data['reason'] ?? '');

        if ($sellerId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'seller_id is required']);
            exit;
        }

        $stmt = $conn->prepare("SELECT * FROM seller_kyc WHERE seller_id = ? LIMIT 1");
        $stmt->bind_param('i', $sellerId);
        $stmt->execute();
        $kyc = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$kyc) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'No KYC details found for this seller']);
            exit;
        }

        if ($action === 'approve') {
            $stmt = $conn->prepare("UPDATE seller_kyc SET status = 'verified', verified_at = NOW(), updated_at = NOW() WHERE seller_id = ?");
            $stmt->bind_param('i', $sellerId);
            $stmt->execute();
            $stmt->close();

            createNotification($conn, null, $sellerId, 'success', 'KYC Verified', 'Your KYC details have been verified by admin. You can now request withdrawal.');

            echo json_encode(['success' => true, 'message' => 'Seller KYC verified']);
            exit;
        }

        if ($action === 'reject') {
            $stmt = $conn->prepare("UPDATE seller_kyc SET status = 'rejected', verified_at = NULL, updated_at = NOW() WHERE seller_id = ?");
            $stmt->bind_param('i', $sellerId);
            $stmt->execute();
            $stmt->close();

            $notificationMessage = 'Your KYC details have been rejected by admin.';
            if ($reason !== '') {
                $notificationMessage .= ' Reason: ' . $reason;
            }

            createNotification($conn, null, $sellerId, 'error', 'KYC Rejected', $notificationMessage);

            echo json_encode(['success' => true, 'message' => 'Seller KYC rejected']);
            exit;
        }

        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        exit;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    exit;
}
