<?php
 
header("Access-Control-Allow-Origin: https://uptulathemehub.com");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
 
// ✅ Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
 
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/razorpay.php';
 
use Razorpay\Api\Api;
 
header('Content-Type: application/json; charset=utf-8');
 
// 🔐 Use Razorpay keys from config
$keyId = RAZORPAY_KEY_ID;
$keySecret = RAZORPAY_KEY_SECRET;
 
try {
    // Initialize Razorpay
    $api = new Api($keyId, $keySecret);
 
    // Get request body
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
 
    // ❌ Invalid request
    if (!$data || !isset($data['amount'])) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Amount not provided"
        ]);
        exit;
    }
 
    // ✅ Accept decimal amount
    $amount = floatval($data['amount']);
 
    if ($amount <= 0) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Invalid amount"
        ]);
        exit;
    }
 
    // ✅ Convert ₹ → paise (important)
    $amountPaise = (int) round($amount * 100);
 
    // 🔍 Debug log (check in apache logs)
    error_log("Creating Razorpay Order: ₹$amount → $amountPaise paise");
 
    // Create order
    $orderData = [
        'receipt' => 'order_' . time(),
        'amount' => $amountPaise,
        'currency' => 'INR'
    ];
 
    $order = $api->order->create($orderData);
 
    // ✅ IMPORTANT: return clean response for frontend
    echo json_encode([
        "success" => true,
        "id" => $order['id'],
        "amount" => $order['amount'],
        "currency" => $order['currency']
    ]);
 
} catch (Exception $e) {
    // ❌ Razorpay or server error
    http_response_code(500);
 
    $errorMsg = $e->getMessage();
    $errorCode = $e->getCode();
   
    // Enhanced logging for debugging
    error_log("═══════════════════════════════════════");
    error_log("❌ RAZORPAY ERROR - " . date('Y-m-d H:i:s'));
    error_log("Message: " . $errorMsg);
    error_log("Code: " . $errorCode);
    error_log("Type: " . get_class($e));
    error_log("OpenSSL: " . (extension_loaded('openssl') ? 'YES' : 'NO'));
    error_log("cURL: " . (extension_loaded('curl') ? 'YES' : 'NO'));
   
    // Check DNS resolution
    $ip = @gethostbyname('api.razorpay.com');
    if ($ip === 'api.razorpay.com') {
        error_log("⚠️  DNS RESOLUTION FAILED for api.razorpay.com");
    } else {
        error_log("✅ DNS resolved to: $ip");
    }
   
    error_log("Trace: " . $e->getTraceAsString());
    error_log("═══════════════════════════════════════");
 
    echo json_encode([
        "success" => false,
        "error" => "Order creation failed",
        "message" => $errorMsg,
        "code" => $errorCode,
        "debug_info" => [
            "openssl_loaded" => extension_loaded('openssl'),
            "curl_loaded" => extension_loaded('curl'),
            "error_type" => get_class($e)
        ]
    ]);
}