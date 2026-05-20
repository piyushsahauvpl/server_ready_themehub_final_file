<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

/* ===== CORS ===== */
header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../config/database.php';
session_start();

/* ===== AUTH ===== */
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$conn = getDBConnection();

/* ===== FIXED AMOUNT ===== */
$amount = 99;
$payment_method = 'card';
$notes = 'Seller activation payment';

/* ===== GET SELLER ===== */
$seller_check = $conn->prepare("SELECT id, user_id FROM sellers WHERE user_id = ?");
$seller_check->bind_param("i", $_SESSION['user_id']);
$seller_check->execute();
$seller = $seller_check->get_result()->fetch_assoc();

if (!$seller) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Seller account not found']);
    exit;
}

// seller_payments actually uses users.id for FK in this schema
$seller_id = $seller['user_id'];

/* ===== PREVENT DUPLICATE PAYMENT ===== */
$checkPayment = $conn->prepare("
    SELECT id FROM seller_payments 
    WHERE seller_id = ? AND status = 'completed'
    LIMIT 1
");
$checkPayment->bind_param("i", $seller_id);
$checkPayment->execute();
$exists = $checkPayment->get_result()->fetch_assoc();

if ($exists) {
    echo json_encode([
        'success' => true,
        'message' => 'Seller already activated',
        'already_paid' => true
    ]);
    exit;
}

/* ===== INSERT PAYMENT ===== */
$insert_payment = $conn->prepare("
    INSERT INTO seller_payments
    (seller_id, transaction_id, amount, currency, payment_method, status, notes, created_at, approved_at, approved_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)
");

if ($insert_payment === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare failed']);
    exit;
}

$transaction_id = 'TXN-' . time() . '-' . rand(1000, 9999);
$currency = 'INR';
$status = 'completed';
$approved_by = 1;

$insert_payment->bind_param(
    "isissssi",
    $seller_id, // ✅ FIXED
    $transaction_id,
    $amount,
    $currency,
    $payment_method,
    $status,
    $notes,
    $approved_by
);

if (!$insert_payment->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Payment insert failed']);
    exit;
}

/* ===== ACTIVATE SELLER ===== */
$update = $conn->prepare("
    UPDATE sellers
    SET payment_confirmed = 1,
        payment_confirmed_date = NOW()
    WHERE user_id = ?
");

$update->bind_param("i", $_SESSION['user_id']);

if (!$update->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Activation failed']);
    exit;
}

/* ===== RESPONSE ===== */
echo json_encode([
    'success' => true,
    'message' => 'Payment successful. Seller account activated!',
    'transaction_id' => $transaction_id,
    'amount' => $amount
]);
exit;
?>