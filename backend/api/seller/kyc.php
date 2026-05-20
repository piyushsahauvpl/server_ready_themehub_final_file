<?php
/**
* Seller KYC API
* GET: fetch KYC status for authenticated seller
* POST: update seller bank/KYC details and set status to pending
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
    $method = $_SERVER['REQUEST_METHOD'];
 
    if ($method === 'GET') {
        $kyc = getSellerKyc($conn, $sellerId);
        echo json_encode(['success' => true, 'kyc' => $kyc]);
        exit;
    }
 
    if ($method === 'POST') {
        $data = getRequestData();
        $details = normalizeBankDetails($data['details'] ?? []);
 
        if (empty($details['account_number']) || empty($details['ifsc']) || empty($details['account_holder_name'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Account holder name, account number, and IFSC are required']);
            exit;
        }
 
        $details['pan']       = trim($data['details']['pan'] ?? '');
        $details['phone']     = trim($data['details']['phone'] ?? $seller['user_phone'] ?? '');
        $details['bank_name'] = trim($data['details']['bank_name'] ?? '');
        $detailsJson = json_encode($details);
 
        $stmt = $conn->prepare("
            INSERT INTO seller_kyc (seller_id, status, details, verified_at)
            VALUES (?, 'pending', ?, NULL)
            ON DUPLICATE KEY UPDATE
                status     = 'pending',
                details    = VALUES(details),
                verified_at = NULL,
                updated_at = CURRENT_TIMESTAMP
        ");
        $stmt->bind_param('is', $sellerId, $detailsJson);
        $stmt->execute();
        $stmt->close();
 
        // FIX: correct parameter order → ($conn, $userId, $sellerId, $type, $title, $message)
        createNotification(
            $conn,
            null,
            $sellerId,
            'info',
            'KYC Updated',
            'Your KYC / bank details have been updated and are pending verification.'
        );
 
        echo json_encode(['success' => true, 'message' => 'KYC details saved. Await admin verification.']);
        exit;
    }
 
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
 
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}