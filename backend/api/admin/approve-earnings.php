<?php
require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/jwt.php';
require_once __DIR__ . '/../payout/common.php';

ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
ob_start();

set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    if (ob_get_length()) {
        ob_end_clean();
    }
    $message = is_string($errstr) ? $errstr : print_r($errstr, true);
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(["success" => false, "message" => "Server error: $message"]);
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
        $message = is_string($error['message']) ? $error['message'] : print_r($error['message'], true);
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(["success" => false, "message" => "Shutdown error: " . $message]);
        exit;
    }
});

header('Content-Type: application/json');

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
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$payload = require_jwt(['ADMIN']);
$adminId = $payload['id'];

$conn = getDBConnection();
ensurePayoutTables($conn);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // List pending earnings
    $stmt = $conn->prepare("
        SELECT
            se.id,
            se.seller_id,
            se.order_id,
            se.amount,
            se.commission_rate,
            se.created_at,
            s.business_name,
            s.user_id,
            u.full_name as seller_name,
            u.email as seller_email,
            p.name as product_name,
            o.amount as order_amount
        FROM seller_earnings se
        JOIN sellers s ON se.seller_id = s.id
        JOIN users u ON s.user_id = u.id
        JOIN orders o ON se.order_id = o.id
        JOIN products p ON o.product_id = p.id
        WHERE se.status = 'pending'
        ORDER BY se.created_at DESC
    ");
    $stmt->execute();
    $result = $stmt->get_result();
    $earnings = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    echo json_encode(["success" => true, "earnings" => $earnings]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $earningIds = [];
    if (isset($data['earning_ids']) && is_array($data['earning_ids'])) {
        $earningIds = $data['earning_ids'];
    } elseif (isset($data['seller_id'])) {
        if (!is_scalar($data['seller_id'])) {
            echo json_encode(["success" => false, "message" => "Invalid seller_id"]);
            exit;
        }

        $sellerId = intval($data['seller_id']);
        if ($sellerId <= 0) {
            echo json_encode(["success" => false, "message" => "Invalid seller_id"]);
            exit;
        }

        $stmt = $conn->prepare("SELECT id FROM seller_earnings WHERE seller_id = ? AND status = 'pending'");
        $stmt->bind_param("i", $sellerId);
        $stmt->execute();
        $result = $stmt->get_result();
        $pendingEarnings = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        foreach ($pendingEarnings as $earning) {
            $earningIds[] = $earning['id'];
        }
    }

    if (empty($earningIds) || !is_array($earningIds)) {
        echo json_encode(["success" => false, "message" => "earning_ids array required or seller has no pending earnings"]);
        exit;
    }

    $approvedEarnings = [];

    $conn->begin_transaction();

    try {
        foreach ($earningIds as $earningId) {
            // Get earning details
            $stmt = $conn->prepare("
                SELECT se.seller_id, se.amount, se.order_id, s.business_name, u.email
                FROM seller_earnings se
                JOIN sellers s ON se.seller_id = s.id
                JOIN users u ON s.user_id = u.id
                WHERE se.id = ? AND se.status = 'pending'
            ");
            $stmt->bind_param("i", $earningId);
            $stmt->execute();
            $earning = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if (!$earning) continue;

            $sellerId = $earning['seller_id'];
            $amount = floatval($earning['amount']);
            $orderId = $earning['order_id'];

            // Credit seller wallet
            $stmt = $conn->prepare("INSERT INTO seller_wallet (seller_id, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = balance + VALUES(balance)");
            $stmt->bind_param("id", $sellerId, $amount);
            $stmt->execute();
            $stmt->close();

            // Get new balance
            $stmt = $conn->prepare("SELECT balance FROM seller_wallet WHERE seller_id = ? LIMIT 1");
            $stmt->bind_param("i", $sellerId);
            $stmt->execute();
            $walletRow = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            $balanceAfter = floatval($walletRow['balance'] ?? 0);

            // Log transaction
            addWalletTransaction($conn, $sellerId, 'credit', $amount, $balanceAfter, 'earning_approval', $earningId, 'Earnings approved by admin');

            // Debit admin wallet for seller payout
            $adminBalanceAfter = updateAdminWalletBalance($conn, $amount, 'debit', 'earning_approval', $earningId, 'Seller payout approved');

            // Update seller earnings status
            $stmt = $conn->prepare("UPDATE seller_earnings SET status = 'paid', paid_at = NOW() WHERE id = ?");
            $stmt->bind_param("i", $earningId);
            $stmt->execute();
            $stmt->close();

            // Update seller totals and protect against null columns
            $stmt = $conn->prepare("UPDATE sellers SET pending_earnings = COALESCE(pending_earnings, 0) - ?, total_earnings = COALESCE(total_earnings, 0) + ? WHERE id = ?");
            $stmt->bind_param("ddi", $amount, $amount, $sellerId);
            $stmt->execute();
            $stmt->close();

            // Create notification
            createNotification($conn, null, $sellerId, 'success', 'Earnings Approved', "Your earnings of ₹{$amount} for order #{$orderId} have been approved and credited to your wallet.");

            $approvedEarnings[] = [
                'id' => $earningId,
                'seller_id' => $sellerId,
                'amount' => $amount,
                'seller_name' => $earning['business_name'] ?: $earning['email']
            ];
        }

        $conn->commit();

        echo json_encode([
            "success" => true,
            "message" => "Approved " . count($approvedEarnings) . " earnings",
            "approved" => $approvedEarnings
        ]);

    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(["success" => false, "message" => "Approval failed: " . $e->getMessage()]);
    }

    exit;
}

echo json_encode(["success" => false, "message" => "Method not allowed"]);
?>