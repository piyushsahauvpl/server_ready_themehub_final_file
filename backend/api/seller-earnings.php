<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Access-Control-Allow-Origin: https://uptulathemehub.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';
require_once '../middleware/auth.php';

// Auth check
$userId = checkAuth();
if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Verify user is a seller
$conn = getDBConnection();
$stmt = $conn->prepare("SELECT id FROM sellers WHERE user_id = ? LIMIT 1");
$stmt->bind_param("i", $userId);
$stmt->execute();

if ($stmt->get_result()->num_rows === 0) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Not a seller']);
    exit;
}

$sellerId = $userId;

// Get month filter
$month = trim($_GET['month'] ?? '');
if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
    $month = date('Y-m');
}

$startDate = $month . '-01 00:00:00';
$endDate = date('Y-m-t 23:59:59', strtotime($startDate));

// Calculate earnings for the month
$stmt = $conn->prepare("
    SELECT 
        SUM(CASE WHEN o.status = 'completed' THEN o.amount ELSE 0 END) as total_sales,
        SUM(CASE WHEN r.status = 'refunded' THEN r.amount ELSE 0 END) as refund_deductions,
        COUNT(DISTINCT CASE WHEN r.status = 'refunded' THEN r.id END) as refund_count
    FROM orders o
    LEFT JOIN refunds r ON o.id = r.order_id AND r.updated_at >= ? AND r.updated_at < ?
    WHERE o.seller_id = ? AND o.created_at >= ? AND o.created_at < ?
");

$stmt->bind_param(
    "sssss",
    $startDate, $endDate,
    $sellerId,
    $startDate, $endDate
);
$stmt->execute();
$result = $stmt->get_result();

$earningsData = $result->fetch_assoc();

$totalSales = floatval($earningsData['total_sales'] ?? 0);
$refundDeductions = floatval($earningsData['refund_deductions'] ?? 0);
$refundCount = intval($earningsData['refund_count'] ?? 0);

// Calculate net earnings and commission
$commissionRate = 0.10; // 10% commission
$commission = $totalSales * $commissionRate;
$netEarnings = $totalSales - $refundDeductions - $commission;

// Get detailed transactions
$stmt = $conn->prepare("
    SELECT 
        t.id, t.transaction_type, t.amount, t.description,
        t.refund_id, t.created_at
    FROM seller_earnings_transactions t
    WHERE t.seller_id = ? AND t.created_at >= ? AND t.created_at < ?
    ORDER BY t.created_at DESC
");

$stmt->bind_param(
    "iss",
    $sellerId,
    $startDate,
    $endDate
);
$stmt->execute();
$transactionsResult = $stmt->get_result();

$transactions = [];
while ($row = $transactionsResult->fetch_assoc()) {
    $transactions[] = $row;
}

echo json_encode([
    'success' => true,
    'earnings' => [
        'total_sales' => $totalSales,
        'refund_deductions' => $refundDeductions,
        'refund_count' => $refundCount,
        'commission' => $commission,
        'net_earnings' => $netEarnings,
        'month' => $month
    ],
    'transactions' => $transactions
]);
