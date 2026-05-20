<?php
require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/jwt.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../payout/common.php';

ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
ob_start();

set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    if (ob_get_length()) {
        ob_end_clean();
    }
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(["success" => false, "message" => "Server error: $errstr"]);
    exit;
});

set_exception_handler(function ($exception) {
    if (ob_get_length()) {
        ob_end_clean();
    }
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(["success" => false, "message" => "Server exception: " . $exception->getMessage()]);
    exit;
});

register_shutdown_function(function () {
    $error = error_get_last();
    if ($error !== null) {
        if (ob_get_length()) {
            ob_end_clean();
        }
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(["success" => false, "message" => "Shutdown error: " . $error['message']]);
        exit;
    }
});

header('Content-Type: application/json; charset=utf-8');

if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) === 'HTTP_') {
                $headerName = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
                $headers[$headerName] = $value;
            }
        }
        return $headers;
    }
}

// CORS
header("Access-Control-Allow-Origin: https://uptulathemehub.com");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Comprehensive authentication handling
$authenticated = false;

// Option 1: Check for ADMINSESSID cookie first
if (!empty($_COOKIE['ADMINSESSID'])) {
    if (session_status() === PHP_SESSION_NONE) {
        session_name('ADMINSESSID');
        session_start();
    } elseif (session_name() !== 'ADMINSESSID') {
        session_write_close();
        session_name('ADMINSESSID');
        session_start();
    }
    
    if (!empty($_SESSION['admin_id'])) {
        $authenticated = true;
    }
}

// Option 2: Check default session if not authenticated
if (!$authenticated && session_status() === PHP_SESSION_NONE) {
    session_start();
    if (!empty($_SESSION['admin_id'])) {
        $authenticated = true;
    }
}

// Option 3: Try JWT if session methods didn't work
if (!$authenticated) {
    require_jwt(['ADMIN']);
}
$conn = getDBConnection();
ensurePayoutTables($conn);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get comprehensive wallet summary
    $adminWallet = getAdminWallet($conn);

    // Total seller wallet balance from the actual wallet table
    $stmt = $conn->prepare("SELECT COALESCE(SUM(balance), 0) as total_seller_balance FROM seller_wallet");
    $stmt->execute();
    $sellerBalance = floatval($stmt->get_result()->fetch_assoc()['total_seller_balance']);
    $stmt->close();

    // Total withdrawn amount (from withdraw_requests where status = 'paid')
    $stmt = $conn->prepare("SELECT COALESCE(SUM(amount), 0) as total_withdrawn FROM withdraw_requests WHERE status = 'paid'");
    $stmt->execute();
    $totalWithdrawn = $stmt->get_result()->fetch_assoc()['total_withdrawn'];
    $stmt->close();

    // Total pending withdrawals
    $stmt = $conn->prepare("SELECT COALESCE(SUM(amount), 0) as pending_withdrawals FROM withdraw_requests WHERE status = 'pending'");
    $stmt->execute();
    $pendingWithdrawals = $stmt->get_result()->fetch_assoc()['pending_withdrawals'];
    $stmt->close();

    // Calculate total commission earned from completed orders
    // Commission = Total order amount - Total seller earnings
    $stmt = $conn->prepare("
        SELECT COALESCE(SUM(o.amount), 0) as total_revenue
        FROM orders o
        WHERE o.status = 'completed'
    ");
    $stmt->execute();
    $totalRevenue = floatval($stmt->get_result()->fetch_assoc()['total_revenue']);
    $stmt->close();
    
    $totalCommission = $totalRevenue - $sellerBalance;

    // Additional metrics
    $stmt = $conn->prepare("
        SELECT
            COUNT(DISTINCT s.id) as total_sellers,
            COUNT(DISTINCT CASE WHEN sw.balance > 0 THEN s.id END) as active_sellers,
            COUNT(DISTINCT CASE WHEN wr.status = 'pending' THEN wr.seller_id END) as sellers_with_pending_withdrawals
        FROM sellers s
        LEFT JOIN seller_wallet sw ON s.id = sw.seller_id
        LEFT JOIN withdraw_requests wr ON s.id = wr.seller_id
    ");
    $stmt->execute();
    $additionalMetrics = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    echo json_encode([
        "success" => true,
        "summary" => [
            "admin_wallet_balance" => floatval($adminWallet['balance']),
            "total_platform_balance" => floatval($adminWallet['balance']),
            "total_seller_wallet_balance" => floatval($sellerBalance),
            "total_withdrawn_amount" => floatval($totalWithdrawn),
            "total_pending_withdrawals" => floatval($pendingWithdrawals),
            "total_commission_earned" => floatval($totalCommission),
            "total_sellers" => intval($additionalMetrics['total_sellers']),
            "active_sellers" => intval($additionalMetrics['active_sellers']),
            "sellers_with_pending_withdrawals" => intval($additionalMetrics['sellers_with_pending_withdrawals'])
        ]
    ]);
    exit;
}

echo json_encode(["success" => false, "message" => "Method not allowed"]);
?>