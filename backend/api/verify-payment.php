<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/payout/common.php';
use Razorpay\Api\Api;
use Razorpay\Api\Errors\SignatureVerificationError;
 
header('Content-Type: application/json; charset=utf-8');
 
// CORS (IMPORTANT)
header("Access-Control-Allow-Origin: https://uptulathemehub.com");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
 
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
 
// Do not auto-create session when no session cookie exists (prevents overwriting valid user session)
$secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
if (isset($_COOKIE[session_name()])) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.cookie_secure', $secure ? 1 : 0);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_samesite', $secure ? 'None' : 'Lax');
    ini_set('session.cookie_path', '/');
    session_start();
}
 
$data = json_decode(file_get_contents("php://input"), true);
 
$userId = null;
 
if (isset($_SESSION['user_id'])) {
    $userId = $_SESSION['user_id'];
}
 
// Fallback: client may provide user_id from localStorage when cookies are not included.
// NOTE: this is a fallback for cross-origin local dev and no-session requests.
if (!$userId && !empty($data['user_id'])) {
    $userId = intval($data['user_id']);
}
 
if (!$userId) {
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}
 
if (!$data) {
    echo json_encode(["success" => false, "message" => "Invalid data"]);
    exit;
}
 
$keyId = RAZORPAY_KEY_ID;
$keySecret = RAZORPAY_KEY_SECRET;
 
$api = new Api($keyId, $keySecret);
 
try {
    // ✅ VERIFY SIGNATURE
    $attributes = [
        'razorpay_order_id' => $data['razorpay_order_id'],
        'razorpay_payment_id' => $data['razorpay_payment_id'],
        'razorpay_signature' => $data['razorpay_signature']
    ];
 
    $api->utility->verifyPaymentSignature($attributes);
 
    $conn = getDBConnection();
    ensurePayoutTables($conn);
 
    // Seller activation flow
    if (!empty($data['seller_activation'])) {
        // Ensure seller exists for user
        $stmt = $conn->prepare("SELECT id, user_id, payment_confirmed FROM sellers WHERE user_id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $seller = $stmt->get_result()->fetch_assoc();
        $stmt->close();
 
        if (!$seller) {
            echo json_encode(["success" => false, "message" => "Seller account not found"]);
            exit;
        }
 
        if ($seller['payment_confirmed'] == 1) {
            echo json_encode(["success" => true, "message" => "Seller already activated", "already_paid" => true]);
            exit;
        }
 
        // seller_payments uses users.id (seller user id) in this schema
        $sellerUserId = $seller['user_id'];
 
        // Prevent duplicate seller payment records
        $stmt = $conn->prepare("SELECT id FROM seller_payments WHERE seller_id = ? AND status = 'completed' LIMIT 1");
        $stmt->bind_param("i", $sellerUserId);
        $stmt->execute();
        $existing = $stmt->get_result()->fetch_assoc();
        $stmt->close();
 
        if ($existing) {
            echo json_encode(["success" => true, "message" => "Seller already activated", "already_paid" => true]);
            exit;
        }
 
        $amount = floatval($data['amount'] ?? 0) ?: 99;
 
        // Avoid duplicate payment record for same Razorpay payment id
        $dup = $conn->prepare("SELECT id FROM seller_payments WHERE transaction_id = ? LIMIT 1");
        $dup->bind_param("s", $data['razorpay_payment_id']);
        $dup->execute();
        $dupRes = $dup->get_result()->fetch_assoc();
        $dup->close();
 
        if ($dupRes) {
            echo json_encode(["success" => true, "message" => "Seller payment already recorded", "transaction_id" => $data['razorpay_payment_id']]);
            exit;
        }
 
        $stmt = $conn->prepare("INSERT INTO seller_payments (seller_id, transaction_id, amount, currency, payment_method, status, notes, created_at, approved_at, approved_by) VALUES (?, ?, ?, 'INR', 'razorpay', 'completed', ?, NOW(), NOW(), 1)");
        $note = 'Seller activation payment via Razorpay';
        $transactionId = $data['razorpay_payment_id'];
        $stmt->bind_param("isds", $sellerUserId, $transactionId, $amount, $note);
 
        if (!$stmt->execute()) {
            echo json_encode(["success" => false, "message" => "Failed to save seller payment", "error" => $conn->error]);
            exit;
        }
        $stmt->close();
 
        $stmt = $conn->prepare("UPDATE sellers SET payment_confirmed = 1, payment_confirmed_date = NOW() WHERE user_id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $stmt->close();
 
        echo json_encode(["success" => true, "message" => "Seller account activated", "transaction_id" => $transactionId]);
        exit;
    }
 
    $orderIds = [];
 
    // ✅ HANDLE MULTIPLE ITEMS
    foreach ($data['items'] as $item) {
 
        $productId = intval($item['id']);
        $qty = intval($item['qty'] ?? 1);
 
        // 🔐 Get product from DB (secure)
        $stmt = $conn->prepare("SELECT price, seller_id FROM products WHERE id = ?");
        $stmt->bind_param("i", $productId);
        $stmt->execute();
        $product = $stmt->get_result()->fetch_assoc();
        $stmt->close();
 
        if (!$product) continue;
 
        $price = floatval($product['price']);
        $sellerId = $product['seller_id'];
 
        $itemTotal = $price * $qty;
 
        // 💰 Commission (80/20)
        $sellerEarning = $itemTotal * 0.8;
        $adminEarning = $itemTotal * 0.2;
 
        // ✅ INSERT ORDER (MATCH orders.php FORMAT)
        $stmt = $conn->prepare("
            INSERT INTO orders
            (user_id, product_id, amount, status, billing_address, payment_method)
            VALUES (?, ?, ?, 'completed', ?, 'razorpay')
        ");
 
        $stmt->bind_param(
            "iids",
            $userId,
            $productId,
            $itemTotal,
            $data['billing_address']
        );
 
        $stmt->execute();
        $orderId = $conn->insert_id;
        $stmt->close();
 
        $orderIds[] = $orderId;
 
        // 💰 CREDIT ADMIN WALLET using proper wallet function
        updateAdminWalletBalance($conn, $itemTotal, 'credit', 'order', $orderId, 'Payment received from customer');
 
        // 💰 SELLER PENDING EARNINGS (will be approved by admin later)
        if ($sellerId) {
            $stmt = $conn->prepare("
                INSERT INTO seller_earnings
                (seller_id, order_id, amount, commission_rate, status)
                VALUES (?, ?, ?, 80.00, 'pending')
            ");
            $stmt->bind_param("iid", $sellerId, $orderId, $sellerEarning);
            $stmt->execute();
            $stmt->close();
 
            $stmt = $conn->prepare("
                UPDATE sellers
                SET pending_earnings = pending_earnings + ?
                WHERE id = ?
            ");
            $stmt->bind_param("di", $sellerEarning, $sellerId);
            $stmt->execute();
            $stmt->close();
        }
    }
 
    echo json_encode([
        "success" => true,
        "orders" => $orderIds
    ]);
 
} catch (SignatureVerificationError $e) {
 
    echo json_encode([
        "success" => false,
        "message" => "Invalid payment signature"
    ]);
 
} catch (Exception $e) {
 
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}