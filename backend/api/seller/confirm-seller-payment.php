<?php
header('Content-Type: application/json');

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('Unauthorized');
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['message_id'])) {
        throw new Exception('message_id is required');
    }

    $message_id = (int)$data['message_id'];
    $user_id = (int)$_SESSION['user_id'];
    $timestamp = date('Y-m-d H:i:s');

    /* 1️⃣ Get seller ID for logged-in user */
    $sellerStmt = $db->prepare("SELECT id FROM sellers WHERE user_id = ?");
    $sellerStmt->bind_param("i", $user_id);
    $sellerStmt->execute();
    $sellerRes = $sellerStmt->get_result();
    $seller = $sellerRes->fetch_assoc();

    if (!$seller) {
        throw new Exception('Seller record not found');
    }

    $seller_id = (int)$seller['id'];

    /* 2️⃣ Verify payment approval message belongs to seller */
    $msgStmt = $db->prepare("
        SELECT id FROM seller_messages
        WHERE id = ? AND seller_id = ? AND message_type = 'payment_approval'
    ");
    $msgStmt->bind_param("ii", $message_id, $seller_id);
    $msgStmt->execute();

    if ($msgStmt->get_result()->num_rows === 0) {
        throw new Exception('Invalid or unauthorized payment message');
    }

    /* 3️⃣ Verify payment exists */
    $payStmt = $db->prepare("
        SELECT id FROM seller_payments
        WHERE seller_id = ? AND status = 'approved'
        LIMIT 1
    ");
    $payStmt->bind_param("i", $seller_id);
    $payStmt->execute();

    if ($payStmt->get_result()->num_rows === 0) {
        throw new Exception('Payment not found or not approved');
    }

    /* 4️⃣ Activate seller */
    $updateSeller = $db->prepare("
        UPDATE sellers
        SET payment_confirmed = 1,
            payment_confirmed_date = ?,
            verification_status = 'active'
        WHERE id = ?
    ");
    $updateSeller->bind_param("si", $timestamp, $seller_id);
    $updateSeller->execute();

    /* 5️⃣ Update user role */
    $updateUser = $db->prepare("UPDATE users SET role = 'seller' WHERE id = ?");
    $updateUser->bind_param("i", $user_id);
    $updateUser->execute();

    /* 6️⃣ Log confirmation */
    $logStmt = $db->prepare("
        INSERT INTO seller_messages_log
        (seller_id, message_id, action, created_at)
        VALUES (?, ?, 'payment_confirmed', ?)
    ");
    $logStmt->bind_param("iis", $seller_id, $message_id, $timestamp);
    $logStmt->execute();

    echo json_encode([
        'success' => true,
        'message' => 'Payment confirmed! Your seller account is now active.'
    ]);
    exit;

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
    exit;
}
